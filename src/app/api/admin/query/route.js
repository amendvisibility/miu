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

    let trimmed = query.trim().replace(/;+\s*$/, "");
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    let runner;

    // 1. If user explicitly provided a `return`, execute as-is
    if (/^\s*return\b/m.test(query)) {
      runner = new AsyncFunction("db", "mongoose", query);
    } else {
      // 2. Try wrapping the entire query expression in `return (...)`
      // This correctly handles single and multi-line statements like `await db.courses.updateMany(...)`
      try {
        runner = new AsyncFunction("db", "mongoose", `return (${trimmed});`);
      } catch (parseErr) {
        // 3. If wrapping threw a SyntaxError (e.g. multi-statement with const/let/var),
        // execute statements sequentially and return a success message
        runner = new AsyncFunction(
          "db",
          "mongoose",
          `${query};\nreturn "Executed successfully (no return value)";`
        );
      }
    }

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

