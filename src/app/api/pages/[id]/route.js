import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Page from '@/models/Page';
import { protect } from '@/lib/auth';

// GET single page
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const page = await Page.findById(id);
    if (!page) return NextResponse.json({ message: 'Page not found' }, { status: 404 });
    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// PUT update page
export async function PUT(req, { params }) {
  try {
    const user = await protect(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    const body = await req.json();
    const page = await Page.findByIdAndUpdate(id, body, { new: true });
    if (!page) return NextResponse.json({ message: 'Page not found' }, { status: 404 });
    return NextResponse.json(page);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE page
export async function DELETE(req, { params }) {
  try {
    const user = await protect(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    const page = await Page.findByIdAndDelete(id);
    if (!page) return NextResponse.json({ message: 'Page not found' }, { status: 404 });
    return NextResponse.json({ message: 'Page deleted' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
