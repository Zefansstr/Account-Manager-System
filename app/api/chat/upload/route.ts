import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST upload file attachment
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const messageId = formData.get("message_id") as string;
    const uploadedBy = formData.get("uploaded_by") as string;

    if (!file || !messageId || !uploadedBy) {
      return NextResponse.json(
        { error: "file, message_id, and uploaded_by are required" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `chat-attachments/${fileName}`;

    // Convert File to ArrayBuffer then to Buffer for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("chat-files")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      
      // If bucket doesn't exist, provide clear instructions
      if (uploadError.message.includes("Bucket not found") || uploadError.message.includes("not found")) {
        return NextResponse.json({
          error: "Storage bucket not configured",
          message: "Please create 'chat-files' bucket in Supabase Dashboard. See SETUP-STORAGE.md for instructions.",
          details: uploadError.message
        }, { status: 500 });
      }
      
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("chat-files")
      .getPublicUrl(filePath);

    // Save attachment info to database
    const { data: attachment, error: dbError } = await supabase
      .from("chat_attachments")
      .insert({
        message_id: messageId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: uploadedBy,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ data: attachment }, { status: 201 });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

