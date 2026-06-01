import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "token";
const VENDOR_URL = process.env.VENDOR_URL; 

export async function GET(req) {
  console.log("Received request for image upload URL");

  try {
    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get("contentType");

    const token = (await cookies()).get(COOKIE_NAME)?.value;
    console.log("Extracted token from cookies:", token ? "Yes" : "No");
    console.log("Ready to send Headers:", {
      Authorization: token,
    }
    );
    if (!token) {
      return NextResponse.json({ message: "not authenticated" }, { status: 401 });
    }

    const backendUrl = `${VENDOR_URL}/api/v1/vendors/me/menus/upload-image-url?contentType=${encodeURIComponent(contentType)}`;
    console.log("Asking real backend:", backendUrl);

    const backendRes = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Authorization": token,
      },
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text().catch(() => "");
      console.error(`Real backend error: ${backendRes.status}, content: ${errorText}`);
      
      return NextResponse.json(
        { message: `後端服務回傳錯誤: ${errorText}` }, 
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Route Error:", error);
    return NextResponse.json({ message: "伺服器內部錯誤" }, { status: 500 });
  }
}