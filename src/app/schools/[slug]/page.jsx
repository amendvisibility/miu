import SchoolPageClient from "./SchoolPageClient";

const SCHOOL_TITLES = {
  "school-of-journalism-&-mass-communication":
    "Journalism & Mass Communication Courses in Imphal | MIU",
  "school-of-design":
    "School of Design | Design Courses in Imphal, Manipur | MIU",
  "school-of-commerce-and-management":
    "School of Commerce & Management Courses in Imphal | MIU",
  "school-of-engineering-and-information-technology":
    "School of Engineering & Information Technology | MIU Imphal",
  "school-of-library-and-information-science":
    "School of Library and Information Science | MIU Manipur",
  "school-of-science":
    "School of Science | Science Courses in Imphal | MIU Manipur",
  "school-of-fire-&-safety":
    "School of Fire & Safety | Fire Safety Courses | MIU Imphal",
  "school-of-paramedical-sciences":
    "School of Paramedical Sciences | Courses in Imphal | MIU",
  "school-of-arts-and-humanities":
    "School of Arts and Humanities | Courses in Imphal | MIU",
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const title =
    SCHOOL_TITLES[decodedSlug] ||
    SCHOOL_TITLES[slug] ||
    "Manipur International University | Excellence in Education";

  return {
    title,
    alternates: {
      canonical: `/schools/${slug}`,
    },
  };
}

export default function Page() {
  return <SchoolPageClient />;
}
