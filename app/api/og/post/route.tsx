import { ImageResponse } from "next/og";

export const runtime = "edge";

function cleanText(value: string | null, fallback: string, maxLength = 110) {
  const text = String(value || fallback)
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function getAutoFontSize(
  text: string,
  sizes: {
    short: number;
    medium: number;
    long: number;
    veryLong: number;
  }
) {
  const length = text.length;

  if (length <= 10) return sizes.short;
  if (length <= 24) return sizes.medium;
  if (length <= 45) return sizes.long;
  return sizes.veryLong;
}

function getCategoryDisplayName(value: string | null) {
  const category = cleanText(value, "Job", 45).toLowerCase();

  if (category.includes("admit") || category.includes("exam")) {
    return "Admit Card & Exam";
  }
  if (category.includes("admission")) return "Admission";
  if (category.includes("result")) return "Result";
  if (category.includes("scheme")) return "Government Scheme";
  if (category.includes("scholar")) return "Scholarship";
  if (category.includes("job")) return "Job";

  return cleanText(value, "Latest", 35)
    .replace(/^latest\s+/i, "")
    .replace(/\s+update$/i, "")
    .replace(/[-_]+/g, " ");
}

function getBannerTags(category: string) {
  const value = category.toLowerCase();

  if (value.includes("result")) {
    return ["Result Details", "How to Check", "Important Date", "Official Link"];
  }
  if (value.includes("admission")) {
    return ["Course Details", "Eligibility", "Important Dates", "Apply Procedure"];
  }
  if (value.includes("admit") || value.includes("exam")) {
    return ["Exam Details", "Exam Date", "Download Steps", "Official Link"];
  }
  if (value.includes("scheme") || value.includes("scholar")) {
    return ["Scheme Details", "Eligibility", "Benefits", "Apply Procedure"];
  }

  return ["Post Details", "Eligibility", "Age Criteria", "Apply Procedure"];
}

function TagBox({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "30px",
        fontWeight: 850,
        color,
        padding: "13px 20px",
        borderRadius: "999px",
        border: "2px solid #e5e7eb",
        background: "#f8fafc",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const category = getCategoryDisplayName(searchParams.get("category"));
  const department = cleanText(
    searchParams.get("department"),
    "Odisha Sathi",
    85
  );
  const posts = cleanText(
    searchParams.get("posts") || searchParams.get("title"),
    "Latest Update",
    100
  );
  const bannerTags = getBannerTags(category);

  const headerText = `Odisha Sathi ${category} Update`;

  const headerFontSize = getAutoFontSize(headerText, {
    short: 82,
    medium: 78,
    long: 70,
    veryLong: 62,
  });

  const departmentFontSize = getAutoFontSize(department, {
    short: 116,
    medium: 96,
    long: 76,
    veryLong: 62,
  });

  const postsFontSize = getAutoFontSize(posts, {
    short: 86,
    medium: 72,
    long: 60,
    veryLong: 50,
  });

  const logoUrl = `${origin}/odisha-sathi-logo.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#ffffff",
          display: "flex",
          position: "relative",
          border: "1px solid #e5e7eb",
          fontFamily: "Arial, sans-serif",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "22px",
            border: "3px dashed #dbeafe",
            borderRadius: "28px",
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "26px",
            left: "34px",
            width: "94px",
            height: "94px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={logoUrl}
            alt="Odisha Sathi"
            style={{
              width: "94px",
              height: "94px",
              objectFit: "contain",
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            top: "26px",
            left: "0",
            right: "0",
            height: "94px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            paddingLeft: "145px",
            paddingRight: "46px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: `${headerFontSize}px`,
              fontWeight: 950,
              color: "#0b63ce",
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            {headerText}
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            textAlign: "center",
            padding: "132px 38px 30px",
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                maxWidth: "1080px",
                fontSize: `${departmentFontSize}px`,
                fontWeight: 950,
                color: "#e85d04",
                lineHeight: 1.02,
                marginBottom: "14px",
                textAlign: "center",
                justifyContent: "center",
              }}
            >
              {department}
            </div>

            <div
              style={{
                display: "flex",
                maxWidth: "1080px",
                fontSize: `${postsFontSize}px`,
                fontWeight: 950,
                color: "#166534",
                lineHeight: 1.08,
                marginBottom: "24px",
                textAlign: "center",
                justifyContent: "center",
              }}
            >
              {posts}
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                maxWidth: "1080px",
              }}
            >
              {bannerTags.map((label, index) => (
                <TagBox
                  key={label}
                  label={label}
                  color={
                    ["#1d4ed8", "#16a34a", "#db2777", "#7c3aed"][
                      index % 4
                    ]
                  }
                />
              ))}
            </div>
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              fontSize: "26px",
              fontWeight: 950,
              color: "#111111",
            }}
          >
            odishasathi.in
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
