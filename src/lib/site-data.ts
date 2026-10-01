export const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "What We Do", to: "/what-we-do" },
  { label: "Programs", to: "/programs" },
  { label: "Impact", to: "/impact" },
  { label: "Events", to: "/events" },
  { label: "Partners", to: "/partners" },
  { label: "Get Involved", to: "/get-involved" },
  { label: "Contact", to: "/contact" },
] as const;

export const socials = {
  telegram: "@yaeleducationalpathway",
  tiktok: "@jaeltata",
  linkedin: "YEP Initiative",
  email: "yaeleducation07@gmail.com",
};

export const services = [
  {
    title: "Scholarship & Education Guidance",
    description:
      "Helping students understand scholarships, admissions, requirements, and international education pathways.",
    icon: "GraduationCap",
  },
  {
    title: "Training & Workshops",
    description: "Practical training, bootcamps, webinars, and information sessions.",
    icon: "Presentation",
  },
  {
    title: "Mentorship",
    description:
      "Connecting students with mentors, alumni, professionals, and experienced members of the education community.",
    icon: "Users",
  },
  {
    title: "Educational Resources",
    description:
      "Accessible content and resources around scholarships, applications, and education opportunities.",
    icon: "BookOpen",
  },
  {
    title: "Community Building",
    description:
      "A supportive community where Ethiopian students can learn, connect, and discover opportunities.",
    icon: "HeartHandshake",
  },
  {
    title: "School & Education Support",
    description:
      "Longer-term approaches to strengthen student support through schools, teachers, and counselors.",
    icon: "School",
  },
] as const;

export const programs = [
  {
    name: "Bachelor's Pathway",
    description:
      "Introduces students to international university applications, scholarships, requirements, preparation, and application strategy.",
    audience: [
      "High school students",
      "Gap-year students",
      "Recent graduates",
      "Early-stage undergraduate applicants",
    ],
  },
  {
    name: "Master's Pathway",
    description:
      "Sessions cover scholarship research, application requirements, CVs, essays, tests, authentication, and other elements of graduate applications.",
    audience: [
      "University graduates",
      "Young professionals",
      "Master's applicants",
      "Professionals exploring international education",
    ],
  },
  {
    name: "Training Cohorts",
    description:
      "Structured training cohorts providing concentrated practical learning around international education applications.",
    audience: [],
  },
  {
    name: "Webinars & Information Sessions",
    description:
      "Connecting students with alumni, mentors, professionals, institutions, and partners.",
    audience: [],
  },
  {
    name: "Mentorship Programs",
    description:
      "Connecting students with people who can provide guidance, perspective, and practical insight.",
    audience: [],
  },
] as const;

export type YepEvent = {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  speakers: string[];
  partners: string[];
  registerUrl?: string;
  takeaways?: string[];
};

/** Data-driven: add real events here and the pages update automatically. */
export const upcomingEvents: YepEvent[] = [];
export const pastEvents: YepEvent[] = [];

export const timeline = [
  { year: "2024", text: "YEP Initiative founded." },
  {
    year: "2025",
    text: "Expansion of educational content, community engagement, training, mentorship, and partnerships.",
  },
  {
    year: "2026",
    text: "YEP community grows beyond 60,000, with 300+ students trained, 50+ success stories, and expanded institutional collaborations.",
  },
] as const;

export const pathwaySteps = [
  "Information",
  "Guidance",
  "Training",
  "Mentorship",
  "Resources",
  "Community",
] as const;

export const values = [
  {
    name: "Empowerment",
    text: "Equipping students with the knowledge and confidence to act on opportunities themselves.",
  },
  {
    name: "Excellence",
    text: "Reliable, high-quality guidance, content, and programs students can trust.",
  },
  {
    name: "Equity",
    text: "Access that does not depend on background, location, or connections.",
  },
  {
    name: "Collaboration",
    text: "Working with schools, mentors, partners, and institutions to widen access.",
  },
  {
    name: "Independent Application",
    text: "Students learn to navigate and submit their own applications, independently.",
  },
] as const;
