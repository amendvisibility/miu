import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { protect } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const user = await protect(request);
    if (!user) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const { query } = await request.json();
    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { message: "Query string is required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const rawDb = mongoose.connection.db;

    // Create a Proxy over MongoDB db instance
    // Allows db.courses.find() as well as db.collection('courses').find()
    const dbProxy = new Proxy(rawDb, {
      get(target, prop) {
        if (typeof prop !== "string") return target[prop];
        if (prop in target) {
          const val = target[prop];
          return typeof val === "function" ? val.bind(target) : val;
        }
        return target.collection(prop);
      },
    });

    let trimmed = query.trim();
    let executableCode = trimmed;

    // If user didn't write an explicit 'return', handle automatic return
    if (!/^\s*return\b/m.test(executableCode)) {
      const lines = executableCode.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length === 1) {
        const withoutSemi = executableCode.replace(/;+\s*$/, "");
        executableCode = `return (${withoutSemi});`;
      } else {
        // Multi-line: if the last statement doesn't have return, prepend return to the last non-empty statement
        const lastLine = lines[lines.length - 1].trim();
        if (!lastLine.startsWith("return ")) {
          lines[lines.length - 1] = `return (${lastLine.replace(/;+\s*$/, "")});`;
          executableCode = lines.join("\n");
        }
      }
    }

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const runner = new AsyncFunction("db", "mongoose", executableCode);

    const startTime = Date.now();
    let result = await runner(dbProxy, mongoose);
    const durationMs = Date.now() - startTime;

    // If result is a MongoDB cursor (e.g. from db.courses.find()), resolve to array
    if (result && typeof result.toArray === "function") {
      result = await result.toArray();
    }

    return NextResponse.json({
      success: true,
      durationMs,
      dbName: rawDb.databaseName,
      result: result !== undefined ? result : "Operation completed with no return value.",
    });
  } catch (error) {
    console.error("Database query execution error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Query execution failed",
      },
      { status: 400 }
    );
  }
}
