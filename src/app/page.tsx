"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import commentsData from "@/data/flirtyComments_with_risque.json";
import { MeshGradient, NeuroNoise } from "@paper-design/shaders-react";

interface CommentEntry {
  date: string;
  specialDay: string;
  risqueImageUrl: string;
  risquePrompt: string;
  flirtyComment: string;
  risqueComment: string;
  innocentlyDirtyComment: string;
  graphicFlirtyComment: string;
}

interface UnsplashPhoto {
  id: string;
  urls: { regular: string; small: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
}

function findClosestDateToToday(): string {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const currentDateString = `${monthNames[currentMonth]} ${currentDay}`;

  const exactMatch = commentsData.find((comment) => comment.date === currentDateString);
  if (exactMatch) return currentDateString;

  let closestDate = commentsData[0]?.date || "";
  let minDifference = Infinity;

  commentsData.forEach((comment) => {
    if (comment.date) {
      const [month, day] = comment.date.split(" ");
      const commentMonth = monthNames.indexOf(month);
      const commentDay = parseInt(day);
      const difference = Math.abs(
        commentMonth * 30 + commentDay - (currentMonth * 30 + currentDay)
      );
      if (difference < minDifference) {
        minDifference = difference;
        closestDate = comment.date;
      }
    }
  });

  return closestDate;
}

function dateStringToDate(dateString: string): Date {
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [month, day] = dateString.split(" ");
  const monthIndex = monthNames.indexOf(month);
  return new Date(new Date().getFullYear(), monthIndex, parseInt(day));
}

function dateToDateString(date: Date): string {
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}

const availableDates = commentsData.map((comment) => dateStringToDate(comment.date));

const UNSPLASH_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

async function fetchUnsplashPhoto(specialDay: string): Promise<UnsplashPhoto | null> {
  try {
    const keywords = specialDay
      .toLowerCase()
      .replace(/\b(national|international|world)\b\s*/g, "")
      .replace(/\bday\b\s*$/, "")
      .trim();
    const query = encodeURIComponent(`${keywords} romantic`);
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=${UNSPLASH_KEY}`
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function triggerUnsplashDownload(downloadLocation: string) {
  try {
    await fetch(`${downloadLocation}&client_id=${UNSPLASH_KEY}`);
  } catch {
    // non-critical
  }
}

export default function DailyFlirtPastelMinimal() {
  const [mood, setMood] = useState<"light" | "dreamy" | "bold">("light");
  const [selectedDate, setSelectedDate] = useState<string>(() => findClosestDateToToday());
  const [flirtLevel, setFlirtLevel] = useState<
    "flirtyComment" | "risqueComment" | "innocentlyDirtyComment" | "graphicFlirtyComment"
  >("flirtyComment");
  const [dailyImage, setDailyImage] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [commentVisible, setCommentVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [photoAttribution, setPhotoAttribution] = useState<{
    name: string;
    profileUrl: string;
    photoUrl: string;
  } | null>(null);

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get("date");
    const levelParam = params.get("level");

    if (dateParam) {
      const decoded = decodeURIComponent(dateParam);
      const exists = commentsData.find((c) => c.date === decoded);
      if (exists) setSelectedDate(decoded);
    }
    if (
      levelParam &&
      ["flirtyComment", "risqueComment", "innocentlyDirtyComment"].includes(levelParam)
    ) {
      setFlirtLevel(levelParam as typeof flirtLevel);
    }
  }, []);

  // Sync URL when date/level changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("date", selectedDate);
    if (flirtLevel !== "graphicFlirtyComment") {
      params.set("level", flirtLevel);
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [selectedDate, flirtLevel]);


  const fadeOut = (callback: () => void) => {
    setCommentVisible(false);
    setTimeout(() => {
      callback();
      setCommentVisible(true);
    }, 200);
  };

  const handleMoodChange = () => {
    const moods: Array<"light" | "dreamy" | "bold"> = ["light", "dreamy", "bold"];
    const currentIndex = moods.indexOf(mood);
    setMood(moods[(currentIndex + 1) % moods.length]);
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const dateString = dateToDateString(date);
      fadeOut(() => {
        setSelectedDate(dateString);
        setFlirtLevel("flirtyComment");
      });
    }
  };

  const handleFlirtLevelChange = (level: typeof flirtLevel) => {
    fadeOut(() => setFlirtLevel(level));
  };

  const handleShowRandomComment = () => {
    const randomIndex = Math.floor(Math.random() * commentsData.length);
    const randomComment = commentsData[randomIndex];
    if (randomComment.date) {
      fadeOut(() => setSelectedDate(randomComment.date));
    }
  };

  const loadUnsplashImage = async (specialDay: string) => {
    setImageLoading(true);
    setPhotoAttribution(null);
    const photo = await fetchUnsplashPhoto(specialDay);
    if (photo) {
      setDailyImage(photo.urls.regular);
      setPhotoAttribution({
        name: photo.user.name,
        profileUrl: photo.user.links.html + "?utm_source=daily_flirt&utm_medium=referral",
        photoUrl: photo.links.html + "?utm_source=daily_flirt&utm_medium=referral",
      });
      triggerUnsplashDownload(photo.links.download_location);
    } else {
      setDailyImage("https://picsum.photos/seed/" + encodeURIComponent(specialDay) + "/800/600");
    }
    setImageLoading(false);
  };

  const handleRefreshImage = () => {
    if (currentComment) loadUnsplashImage(currentComment.specialDay);
  };

  const handleCopy = async () => {
    if (currentComment) {
      await navigator.clipboard.writeText(currentComment[flirtLevel]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleIYKYKClick = () => {
    setShowAgeVerification(true);
  };

  const handleAgeVerification = () => {
    setIsAgeVerified(true);
    setShowAgeVerification(false);
    fadeOut(() => setFlirtLevel("graphicFlirtyComment"));
  };

  const handleSecretCountdownClick = () => {
    setShowCountdown(true);
  };

  const currentComment = commentsData.find(
    (comment) => comment.date === selectedDate
  ) as CommentEntry | undefined;

  // Auto-load image when date changes
  useEffect(() => {
    if (currentComment) loadUnsplashImage(currentComment.specialDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    if (!showCountdown) return;
    const targetDate = new Date("December 17, 2027 00:00:00").getTime();
    const updateCountdown = () => {
      const now = Date.now();
      const distance = Math.max(0, targetDate - now);
      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [showCountdown]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 transition-colors duration-700">
      <div className="absolute inset-0 -z-10">
        {mood === "light" && (
          <MeshGradient
            style={{ width: "100%", height: "100%" }}
            colors={["#fff0f3", "#ffb3c6", "#ff8fab", "#ffc8dd"]}
            distortion={0.5}
            swirl={0.2}
            speed={0.5}
          />
        )}
        {mood === "dreamy" && (
          <NeuroNoise
            style={{ width: "100%", height: "100%" }}
            colorFront="#e8c5ff"
            colorMid="#9b5de5"
            colorBack="#1a0030"
            brightness={0.1}
            contrast={0.2}
            speed={0.5}
          />
        )}
        {mood === "bold" && (
          <MeshGradient
            style={{ width: "100%", height: "100%" }}
            colors={["#ff4d6d", "#ff6b35", "#ffd60a", "#e63946"]}
            distortion={0.9}
            swirl={0.3}
            speed={0.8}
          />
        )}
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-rose-100 relative overflow-hidden">
        <div className="absolute top-4 left-4 text-5xl opacity-30 select-none">💕</div>
        <div className="absolute bottom-4 right-4 text-5xl opacity-30 select-none">✨</div>

        <h1 className="text-4xl font-serif text-rose-500 mb-2 text-center">Flirt of the Day</h1>
        <p className="text-center text-rose-400 mb-6 italic">
          Your daily{" "}
          <button onClick={handleIYKYKClick} className="text-rose-400">
            wink
          </button>{" "}
          and mischievous smile.
        </p>

        {/* Date Selection */}
        <div className="mb-6">
          <label className="block text-rose-400 text-lg mb-2 text-center">✨ Select Your Date ✨</label>
          <div className="relative">
            <DatePicker
              selected={dateStringToDate(selectedDate)}
              onChange={handleDateChange}
              includeDates={availableDates}
              dateFormat="MMMM d"
              placeholderText="Select a date"
              className="w-full p-3 rounded-lg border border-rose-200 bg-white text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300 text-center"
              wrapperClassName="w-full"
              popperClassName="z-50"
              popperPlacement="bottom"
              showPopperArrow={false}
              calendarClassName="border-rose-200 rounded-lg shadow-lg"
              dayClassName={(date) => {
                const dateString = dateToDateString(date);
                const comment = commentsData.find((c) => c.date === dateString);
                return comment ? "bg-rose-50 hover:bg-rose-100" : "";
              }}
            />
          </div>

          {currentComment && (
            <div className="mt-4 bg-rose-50 rounded-xl p-4 text-center border border-rose-200">
              <div className="text-xl font-bold text-rose-700">{currentComment.specialDay}</div>
            </div>
          )}
        </div>

        {/* Flirt Level */}
        <div className="mb-6">
          <p className="text-center text-rose-400 mb-3">Choose Your Flirt Level</p>
          <div className="flex gap-3 justify-center">
            {[
              { key: "innocentlyDirtyComment", label: "Innocent" },
              { key: "flirtyComment", label: "Flirty" },
              { key: "risqueComment", label: "Risqué" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleFlirtLevelChange(key as typeof flirtLevel)}
                className={`px-4 py-2 rounded-xl font-medium transition-transform duration-300 border hover:scale-105 ${
                  flirtLevel === key
                    ? "bg-rose-100 border-rose-300 text-rose-600 shadow"
                    : "bg-white border-rose-200 text-rose-400 hover:bg-rose-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Comment card with fade transition */}
        {currentComment && (
          <div
            className={`transition-opacity duration-200 ${commentVisible ? "opacity-100" : "opacity-0"}`}
          >
            <div className="bg-rose-100 rounded-xl p-4 text-center text-rose-600 font-serif text-xl border border-rose-200 shadow-inner">
              &ldquo;{currentComment[flirtLevel]}&rdquo;
            </div>
            <div className="flex gap-2 mt-3 justify-center">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-rose-200 text-rose-400 hover:bg-rose-50 transition-all duration-200"
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-rose-200 text-rose-400 hover:bg-rose-50 transition-all duration-200"
              >
                {linkCopied ? "✓ Link copied!" : "🔗 Share"}
              </button>
            </div>
          </div>
        )}

        {/* Daily Image */}
        {currentComment && (
          <div
            className={`mt-6 space-y-4 transition-opacity duration-200 ${commentVisible ? "opacity-100" : "opacity-0"}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-rose-400 text-lg font-semibold">✨ Daily Mood Image ✨</h3>
              <button
                onClick={handleRefreshImage}
                className="text-xs text-rose-400 hover:text-rose-500 border border-rose-200 rounded-lg px-2 py-1 hover:bg-rose-50 transition-all"
                title="Refresh image"
              >
                🔄 Refresh
              </button>
            </div>

            {dailyImage && !imageLoading && (
              <div className="w-full rounded-xl overflow-hidden relative shadow-lg border border-rose-200 bg-white">
                <img
                  src={dailyImage}
                  alt={`Daily image for ${currentComment.specialDay}`}
                  className="w-full h-auto max-h-64 object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&h=600&fit=crop&q=80";
                  }}
                />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white/90 px-2 py-1 rounded-full text-xs backdrop-blur-sm">
                  {currentComment.specialDay}
                </div>
              </div>
            )}
            {photoAttribution && !imageLoading && (
              <p className="text-center text-rose-300 text-xs">
                Photo by{" "}
                <a href={photoAttribution.profileUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-rose-400">
                  {photoAttribution.name}
                </a>{" "}
                on{" "}
                <a href={photoAttribution.photoUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-rose-400">
                  Unsplash
                </a>
              </p>
            )}

            {imageLoading && (
              <div className="w-full h-48 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-200">
                <div className="text-rose-400 text-sm">Loading image...</div>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-400 ml-2"></div>
              </div>
            )}

            {!dailyImage && !imageLoading && (
              <div className="w-full h-48 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-200">
                <div className="text-center text-rose-400">
                  <div className="text-3xl mb-2">🖼️</div>
                  <div className="text-sm">No image available for this date</div>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-rose-300 text-sm">
          Powered by <span className="text-rose-400">Next.js</span> &{" "}
          <span className="text-rose-400">Tailwind CSS</span>
        </p>

        <p className="mt-2 text-center text-rose-300 text-xs">
          Made with{" "}
          <button
            onClick={handleSecretCountdownClick}
            className="text-rose-400 cursor-pointer text-lg"
          >
            💕
          </button>{" "}
          by <span className="text-rose-400 font-bold">LaskoCreative</span>
        </p>

        <a href="#secret-countdown" className="sr-only" aria-hidden="true" tabIndex={-1}>
          Secret countdown link
        </a>
      </div>

      {/* Floating action buttons */}
      <div className="fixed bottom-8 right-8 space-y-4 z-20">
        <button
          onClick={handleShowRandomComment}
          className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-2xl hover:scale-110 transition-all duration-300 border border-rose-200"
          title="Show random comment"
        >
          ✨
        </button>
        <button
          onClick={handleMoodChange}
          className="w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-2xl hover:scale-110 transition-all duration-300 border border-rose-200"
          title={`Current mood: ${mood.charAt(0).toUpperCase() + mood.slice(1)}. Click to change mood.`}
        >
          {mood === "light" ? "🌅" : mood === "dreamy" ? "🌙" : "🔥"}
        </button>
      </div>

      {/* Age verification modal */}
      {showAgeVerification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-rose-200 text-center">
            <div className="space-y-6">
              <div className="text-6xl">🔞</div>
              <h1 className="text-3xl font-serif text-rose-500">Age Verification Required</h1>
              <p className="text-rose-600 text-lg leading-relaxed">
                This content contains graphic adult material. You must be 18 or older to continue.
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleAgeVerification}
                  className="w-full bg-rose-500 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  I am 18 or older
                </button>
                <button
                  onClick={() => setShowAgeVerification(false)}
                  className="w-full bg-white text-rose-500 font-semibold py-3 px-6 rounded-2xl border border-rose-200 hover:bg-rose-50 transition-all duration-300"
                >
                  Innocent
                </button>
              </div>
              <p className="text-rose-400 text-sm">
                By clicking &ldquo;I am 18 or older&rdquo;, you confirm that you are of legal age to
                view this content.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Secret countdown modal */}
      {showCountdown && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          id="secret-countdown"
        >
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-rose-200 text-center space-y-6">
            <div className="text-5xl">💕</div>
            <h2 className="text-3xl font-serif text-rose-500">Secret Countdown</h2>
            <p className="text-rose-600">Counting down to December 17, 2027</p>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: "Days", value: countdown.days },
                { label: "Hours", value: countdown.hours },
                { label: "Minutes", value: countdown.minutes },
                { label: "Seconds", value: countdown.seconds },
              ].map(({ label, value }) => (
                <div key={label} className="bg-rose-50 rounded-2xl p-4 border border-rose-200">
                  <div className="text-2xl font-bold text-rose-500">
                    {value.toString().padStart(2, "0")}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-rose-400">{label}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowCountdown(false)}
              className="w-full bg-rose-500 text-white font-semibold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              Keep it secret
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
