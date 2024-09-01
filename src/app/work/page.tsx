import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Work",
  description: "My work experience and professional journey.",
};

const workExperiences = [
  {
    title: "Founding Engineer & Lead",
    company: "Appwrite",
    period: "Oct 2019 - Present",
    description:
      "Started as an Open Source contributor and maintainer, then joined as a Founding Engineer and promoted to Engineering Lead. Played a crucial role in the $10M seed funding round by maximizing engineering and growth KPIs.",
    achievements: [
      "Responsible for architectural reviews of RFCs, design and implementation of highly scalable and multi-tenant Cloud systems",
      "Led key engineering initiatives including Appwrite Cloud, CLI, Cloud Functions, and OAuth providers",
      "Developed and maintained 15+ Client and Server Side SDKs in over 12 different languages",
      "Led open source initiatives like 30 Days of Appwrite and Hacktoberfest 2020, 2021",
      "Managed issue triaging, pull request reviews, and mentorship across 100+ Open source repositories",
    ],
    skills: [
      "Cloud Architecture",
      "Open Source",
      "Leadership",
      "SDK Development",
      "Multi-language Programming",
      "Community Management",
    ],
  },
  {
    title: "Technical Advisor",
    company: "Alphasights",
    period: "Jan 2023 - Present",
    description:
      "Provided technical expertise and guidance on various projects.",
    achievements: [
      "Advised on technology stack decisions",
      "Contributed to strategic technical planning",
    ],
    skills: ["Technical Consulting", "Strategy"],
  },
  {
    title: "Software Engineer",
    company: "Intuit",
    period: "Jan 2020 - May 2021",
    description:
      "Part of the Android team for Mint, Intuit's personal finance app. Played a crucial role in both the Mint Live and Overview Revamp initiatives.",
    achievements: [
      "Developed a framework for A/B testing in MintLive",
      "Redesigned app overview using Android best practices (data binding, view models, MVVM)",
      "Implemented automation using Espresso and unit tests with JUnit and Mockito",
      "Built iOS and Android apps for Intuit Expert Platform, improving expert productivity by over 60%",
      "Developed fault-tolerant, scalable APIs using SpringBoot and Kafka for efficient data querying",
    ],
    skills: [
      "Android",
      "iOS",
      "Java",
      "Swift",
      "A/B Testing",
      "MVVM",
      "SpringBoot",
      "Kafka",
      "Espresso",
      "JUnit",
      "Mockito",
    ],
  },
  {
    title: "Research Engineer",
    company: "Samsung Research",
    period: "May 2019 - Jul 2019",
    description:
      "Focused on visual intelligence and image processing research.",
    achievements: [
      "Developed system for denoising images in ultra-low light environments, improving image quality by 15% over the current pipeline",
      "Improved PSNR of state-of-the-art by up to 7 dB by enhancing model architecture and fine-tuning the network",
      "Proposed and built a CLI tool in Python to set up development environments, reducing setup time from minutes to under 5 seconds",
    ],
    skills: [
      "Computer Vision",
      "Image Processing",
      "Machine Learning",
      "Python",
      "CLI Development",
    ],
  },
  {
    title: "Research Engineer",
    company: "Marsview.ai",
    period: "Jun 2018 - Apr 2019", // Please adjust this period if it's not accurate
    description:
      "Worked on developing AI-powered solutions for driver safety and traffic management.",
    achievements: [
      "Developed APIs for Driver Drowsiness Detection, reducing the risk of accidents by 60%",
      "Optimized the system for real-time computation on low-power devices like Raspberry Pi 3",
      "Built a companion Android app and developed a REST API to display logs and driving performance",
      "Developed a real-time Number Plate Recognition system for CCTV footage, achieving 97% accuracy on Indian number plates",
    ],
    skills: [
      "Computer Vision",
      "API Development",
      "Android Development",
      "Machine Learning",
      "Embedded Systems",
      "Python",
      "Java",
    ],
  },
];

export default function Page() {
  return (
    <section>
      <h1 className="mb-8 text-2xl font-medium tracking-tighter">Work</h1>
      <div className="text-muted-foreground">Coming soon...</div>
      {/* <p className="text-muted-foreground my-8">
        Over the past 5 years, I've had the opportunity to work with some
        amazing companies and individuals. At every step of my journey, I've
        learned something new and grown as a professional. I've been at the
        forefront of AI and open-source development, and I'm excited to continue
        growing and learning.
      </p>

      <Separator className="my-8" />

      <div className="space-y-12 my-8">
        {workExperiences.map((job, index) => (
          <div key={index}>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{job.company}</h3>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-1">{job.title}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{job.period}</p>
            <p className="text-base text-gray-700 dark:text-gray-300 mt-4">{job.description}</p>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-6 mb-2">Key Achievements</h4>
            <ul className="list-disc list-inside space-y-2">
              {job.achievements.map((achievement, i) => (
                <li key={i} className="text-base text-gray-700 dark:text-gray-300">{achievement}</li>
              ))}
            </ul>
          </div>
        ))}
      </div> */}
    </section>
  );
}
