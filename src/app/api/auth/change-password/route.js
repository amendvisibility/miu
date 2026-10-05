import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { protect } from '@/lib/auth';

export async function POST(request) {
  try {
    await dbConnect();

    // Verify logged-in admin via JWT token
    const currentUser = await protect(request);
    if (!currentUser) {
      return NextResponse.json(
        { message: 'Unauthorized. Please login again.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Field presence validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: 'All fields (current password, new password, confirm new password) are required.' },
        { status: 400 }
      );
    }

    // Password match validation
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: 'New password and confirm new password do not match.' },
        { status: 400 }
      );
    }

    // Password length validation
    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Fetch user from DB (protect strips password field)
    const user = await User.findById(currentUser._id);
    if (!user) {
      return NextResponse.json(
        { message: 'Admin user not found.' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentValid = await user.comparePassword(currentPassword);
    if (!isCurrentValid) {
      return NextResponse.json(
        { message: 'Current password is incorrect.' },
        { status: 400 }
      );
    }

    // Ensure new password is not identical to current password
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { message: 'New password must be different from current password.' },
        { status: 400 }
      );
    }

    // Update password (pre-save hook hashes with bcrypt automatically)
    user.password = newPassword;
    await user.save();

    return NextResponse.json(
      { message: 'Password changed successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
