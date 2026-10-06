import LeadershipDetail from "@/components/LeadershipDetail";

// export const metadata = {
//   title: "Chancellor's Message | Manipur International University",
//   description:
//     "Message from the Chancellor of Manipur International University.",
//   alternates: {
//     canonical: "https://miu.edu.in/about/leadership/chancellor",
//   },
// };

const LEADERSHIP_TITLES = {
  chancellor:
    "Chancellor | Leadership at Manipur International University",
  "controller-of-examinations":
    "Controller of Examinations | Leadership | MIU Imphal Manipur",
  registrar:
    "Registrar | Leadership at Manipur International University",
  "vice-chancellor":
    "Vice Chancellor of Manipur International University | MIU",
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const title =
    LEADERSHIP_TITLES[decodedSlug] ||
    LEADERSHIP_TITLES[slug] ||
    "Manipur International University | Excellence in Education";

  return {
    title,
    alternates: {
      canonical: `/about/leadership/${slug}`,
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;

  let leader = null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/about/${slug}`,
      {
        next: {
          revalidate: 500,
        },
      },
    );

    if (res.ok) {
      leader = await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch leader:", error);
  }

  return <LeadershipDetail leader={leader} />;
}
