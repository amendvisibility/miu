
const BASE_URL = "https://miu.edu.in";

export const revalidate = 3600;

const STATIC_LAST_MODIFIED = "2025-01-01T00:00:00.000Z";

const staticRoutes = [
  // Home
  { path: "", priority: 1.0, changeFrequency: "daily" },

  // About
  { path: "/about", priority: 0.9, changeFrequency: "weekly" },
  { path: "/about/governance", priority: 0.8 },
  { path: "/about/academic-council", priority: 0.8 },
  { path: "/about/iqac", priority: 0.8 },
  { path: "/about/affiliations-accreditation", priority: 0.8 },
  { path: "/about/public-self-disclosure", priority: 0.8 },
  { path: "/about/ugc-performa", priority: 0.7 },
  { path: "/about/faqs", priority: 0.6 },

  // Leadership
  { path: "/about/leadership", priority: 0.8 },
  { path: "/about/leadership/chancellor", priority: 0.8 },
  { path: "/about/leadership/vice-chancellor", priority: 0.8 },
  { path: "/about/leadership/registrar", priority: 0.8 },
  {
    path: "/about/leadership/controller-of-examinations",
    priority: 0.8,
  },

  // Admissions
  {
    path: "/admissions",
    priority: 0.9,
    changeFrequency: "weekly",
  },
  { path: "/admissions/process", priority: 0.8 },
  { path: "/admissions/fee-structure", priority: 0.8 },
  { path: "/admissions/rules", priority: 0.7 },

  // Academics
  { path: "/academics/academic-calendar", priority: 0.7 },
  { path: "/academics/brochure", priority: 0.7 },

  // Examination
  { path: "/examination/results", priority: 0.8 },

  // Research
  { path: "/research/overview", priority: 0.8 },
  { path: "/research/publications", priority: 0.8 },
  { path: "/research/projects", priority: 0.8 },
  { path: "/research/development-cell", priority: 0.6 },
  { path: "/research/degree-awarded", priority: 0.6 },

  // Student Life
  { path: "/student-life/sports", priority: 0.6 },
  { path: "/student-life/hostel", priority: 0.6 },
  { path: "/student-life/anti-ragging", priority: 0.6 },
  { path: "/student-life/grievance-cell", priority: 0.6 },
  { path: "/student-life/icc", priority: 0.6 },
  { path: "/student-life/health-facilities", priority: 0.6 },
  { path: "/student-life/awards", priority: 0.6 },
  { path: "/student-life/cpio", priority: 0.5 },
  { path: "/student-life/equal-opportunity-cell", priority: 0.5 },
  { path: "/student-life/ombudsperson", priority: 0.5 },
  {
    path: "/student-life/project-development-cell",
    priority: 0.5,
  },
  { path: "/student-life/sedg-cell", priority: 0.5 },

  // Notices
  {
    path: "/notices-and-announcements",
    priority: 0.8,
    changeFrequency: "daily",
  },

  // Contact and Jobs
  { path: "/contact", priority: 0.8 },
  {
    path: "/jobs",
    priority: 0.8,
    changeFrequency: "weekly",
  },

  // Blogs
  {
    path: "/blogs",
    priority: 0.8,
    changeFrequency: "daily",
  },

  // Other Pages
  { path: "/miunest", priority: 0.8 },
  { path: "/reservation-roster", priority: 0.6 },
  { path: "/refund-policy", priority: 0.5 },
  { path: "/privacy-policy", priority: 0.5 },
  { path: "/terms-of-use", priority: 0.5 },
];

// ---------------------------------------------
// URL HELPERS
// ---------------------------------------------

function buildUrl(path = "") {
  const segments = String(path)
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return encodeURIComponent(
          decodeURIComponent(segment)
        );
      } catch {
        return encodeURIComponent(segment);
      }
    });

  if (segments.length === 0) {
    return `${BASE_URL}/`;
  }

  return `${BASE_URL}/${segments.join("/")}`;
}

function safeDate(value) {
  if (!value) return undefined;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function createEntry({
  path,
  lastModified,
  priority = 0.5,
  changeFrequency = "monthly",
}) {
  const entry = {
    url: buildUrl(path),
    changeFrequency,
    priority,
  };

  const validDate = safeDate(lastModified);

  if (validDate) {
    entry.lastModified = validDate;
  }

  return entry;
}

// ---------------------------------------------
// API FETCH HELPER
// ---------------------------------------------

async function fetchJson(
  path,
  {
    timeoutMs = 10000,
    revalidateSeconds = 3600,
  } = {}
) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(
      `${BASE_URL}${path}`,
      {
        next: {
          revalidate: revalidateSeconds,
        },
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(
        `API ${path} returned ${response.status}`
      );
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------
// DYNAMIC SCHOOLS
// ---------------------------------------------

async function getSchoolRoutes() {
  try {
    const data = await fetchJson(
      "/api/settings/schools-section"
    );

    const schools = data?.content?.schools;

    if (!Array.isArray(schools)) {
      console.error(
        "Sitemap: Invalid schools API response"
      );
      return [];
    }

    return schools
      .filter((school) => school?.slug)
      .map((school) =>
        createEntry({
          path: `/schools/${school.slug}`,
          lastModified: school.updatedAt,
          priority: 0.8,
          changeFrequency: "monthly",
        })
      );
  } catch (error) {
    console.error(
      "Sitemap: Schools fetch failed:",
      error
    );

    return [];
  }
}

// ---------------------------------------------
// DYNAMIC COURSES
// ---------------------------------------------

async function getCourseRoutes() {
  try {
    const data = await fetchJson("/api/courses");

    if (!Array.isArray(data)) {
      console.error(
        "Sitemap: Invalid courses API response"
      );

      return [];
    }

    return data
      .filter((course) => course?.slug)
      .map((course) =>
        createEntry({
          path: `/courses/${course.slug}`,
          lastModified: course.updatedAt,
          priority: 0.64,
          changeFrequency: "weekly",
        })
      );
  } catch (error) {
    console.error(
      "Sitemap: Courses fetch failed:",
      error
    );

    return [];
  }
}

// ---------------------------------------------
// DYNAMIC BLOGS
// ---------------------------------------------

async function getBlogRoutes() {
  try {
    const data = await fetchJson("/api/blogs");

    if (!Array.isArray(data)) {
      console.error(
        "Sitemap: Invalid blogs API response"
      );

      return [];
    }

    return data
      .filter((blog) => blog?.slug)
      .map((blog) =>
        createEntry({
          path: `/blogs/${blog.slug}`,
          lastModified: blog.updatedAt,
          priority: 0.64,
          changeFrequency: "weekly",
        })
      );
  } catch (error) {
    console.error(
      "Sitemap: Blogs fetch failed:",
      error
    );

    return [];
  }
}

// ---------------------------------------------
// REMOVE DUPLICATE URLS
// ---------------------------------------------

function removeDuplicates(entries) {
  const uniqueEntries = new Map();

  for (const entry of entries) {
    if (!entry?.url) continue;

    const normalizedUrl =
      entry.url === `${BASE_URL}/`
        ? entry.url
        : entry.url.replace(/\/+$/, "");

    if (!uniqueEntries.has(normalizedUrl)) {
      uniqueEntries.set(normalizedUrl, {
        ...entry,
        url: normalizedUrl,
      });
    }
  }

  return Array.from(uniqueEntries.values());
}

// ---------------------------------------------
// GENERATE SITEMAP
// ---------------------------------------------

/** @type {() => Promise<import('next').MetadataRoute.Sitemap>} */

export default async function sitemap() {
  // Generate static URLs
  const staticEntries = staticRoutes.map(
    (route) =>
      createEntry({
        ...route,
        lastModified: STATIC_LAST_MODIFIED,
      })
  );

  // Fetch dynamic URLs
  const [
    schoolEntries,
    courseEntries,
    blogEntries,
  ] = await Promise.all([
    getSchoolRoutes(),
    getCourseRoutes(),
    getBlogRoutes(),
  ]);

  // Combine all entries
  const allEntries = [
    ...staticEntries,
    ...schoolEntries,
    ...courseEntries,
    ...blogEntries,
  ];

  // Return unique sitemap URLs
  return removeDuplicates(allEntries);
}
