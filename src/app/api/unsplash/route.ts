import { NextRequest, NextResponse } from "next/server";

interface UnsplashPhoto {
  urls: { regular: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
}

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

function getQuery(specialDay: string) {
  return specialDay
    .toLowerCase()
    .replace(/\b(national|international|world)\b\s*/g, "")
    .replace(/\bday\b\s*$/, "")
    .trim();
}

export async function GET(request: NextRequest) {
  const specialDay = request.nextUrl.searchParams.get("specialDay")?.trim();

  if (!specialDay) {
    return NextResponse.json({ error: "Missing specialDay query parameter." }, { status: 400 });
  }

  if (!UNSPLASH_ACCESS_KEY) {
    return NextResponse.json({ error: "Unsplash is not configured." }, { status: 500 });
  }

  const query = encodeURIComponent(`${getQuery(specialDay)} romantic`);

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Unable to load image." }, { status: response.status });
    }

    const photo = (await response.json()) as UnsplashPhoto;

    void fetch(`${photo.links.download_location}&client_id=${UNSPLASH_ACCESS_KEY}`, {
      cache: "no-store",
    }).catch(() => {
      // Best effort analytics call for Unsplash attribution requirements.
    });

    return NextResponse.json({
      url: photo.urls.regular,
      attribution: {
        name: photo.user.name,
        profileUrl: `${photo.user.links.html}?utm_source=daily_flirt&utm_medium=referral`,
        photoUrl: `${photo.links.html}?utm_source=daily_flirt&utm_medium=referral`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to load image." }, { status: 502 });
  }
}
