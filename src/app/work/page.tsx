import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata = {
  title: "Work",
  description: "My work experience and professional journey.",
};

// Define custom styles for MDX content
const mdxComponents = {
  strong: (props) => <strong className="text-white font-medium" {...props} />,
};

const workExperiences = [
  {
    company: "Appwrite",
    companyUrl: "https://appwrite.io",
    location: "Remote, USA",
    icon: "/companies/appwrite.jpg",
    techStack: [
      "TypeScript",
      "PHP",
      "Go",
      "Docker",
      "Redis",
      "MariaDB",
      "Kubernetes",
      "Terraform",
    ],
    positions: [
      {
        title: "Head of Engineering",
        period: "Nov. 2024 - Present",
        achievements: [
          "Built and led **world-class engineering teams** across Platform, Compute, and Databases, scaling total headcount to 25 engineers while maintaining exceptional talent density",
          "Architected and scaled Appwrite Cloud infrastructure to efficiently handle **over 100M daily requests** with 99.99% availability",
          "Spearheaded Appwrite's AI initiatives including the development of an intelligent **AI assistant powered by RAG** and Appwrite's documentation alongside the [Model Context Protocol server](https://github.com/appwrite/mcp)",
          "Established robust **engineering principles and standards** to ensure strong technical foundations and exceptional code quality across the organization",
          "Designed and implemented comprehensive **disaster recovery plans** for Appwrite Cloud with multi-region failover capabilities",
          "Led the successful **migration from Docker Swarm to Kubernetes** with zero downtime, improving scalability and deployment efficiency",
          "Implemented advanced **monitoring and telemetry systems** using Grafana and Prometheus, enabling proactive issue detection and resolution",
          "Orchestrated cross-functional collaboration between engineering, product, and stakeholder teams through efficient sprint planning and cycle management",
        ],
      },
      {
        title: "Engineering Lead",
        period: "Nov. 2021 - Nov. 2024",
        achievements: [
          "Architected and implemented **multi-cloud infrastructure** for Appwrite Cloud using Terraform, enabling seamless cross-cloud deployments",
          "Executed **zero-downtime migration** of mission-critical MySQL databases with sophisticated data recovery protocols utilizing binary logs and snapshots",
          "Designed the architecture for **Open Runtimes**, Appwrite's open standard for serverless functions that powers Appwrite Functions",
          "Engineered **high-throughput, data-intensive APIs** with built-in redundancy and reliability guarantees for mission-critical systems",
          "Managed Docker Swarm control plane including **disaster recovery scenarios** for leader failures and quorum disruptions",
          "Implemented and led on-call rotation and incident response protocols, ensuring 24/7 system reliability",
          "Optimized MySQL cluster performance through advanced parameter tuning, connection pooling with ProxySQL, and restart optimization, managing petabytes of data in group replication",
        ],
      },
      {
        title: "Founding Engineer",
        period: "Dec. 2020 - Nov. 2021",
        achievements: [
          "Wore **multiple strategic hats** across engineering, developer relations, education, growth hacking, and marketing functions",
          "Conceived and executed **30 Days of Appwrite**, a month-long educational initiative that accelerated developer onboarding and significantly grew the user community",
          "Organized and led Appwrite's **Hacktoberfest collaborations** with DigitalOcean in 2020, 2021, and 2022, featuring prominent industry speakers and technical workshops",
          "Engineered **highly performant and efficient APIs** for authentication, storage, databases, functions, and other core services",
          "Drove key marketing and community initiatives that directly contributed to Appwrite's successful **$10M seed and $27M Series A funding rounds**",
          "Developed and maintained **15+ client and server SDKs** across multiple languages and frameworks including Python, Java, Kotlin, PHP, Node.js, and more",
          "Managed community contributions and code reviews across Appwrite's **100+ open source repositories**, ensuring code quality and standards compliance",
        ],
      },
    ],
  },
  {
    company: "Alphasights",
    companyUrl: "https://www.alphasights.com/",
    location: "New York, USA",
    icon: "/companies/alphasights.jpg",
    positions: [
      {
        title: "Technical Advisor",
        period: "Jan 2023 - Present",
        achievements: [
          "Provide **strategic technical consultations** to C-suite executives and venture capital firms on emerging technologies, helping shape multi-million dollar investment decisions and technology adoption strategies",
          "Conduct **comprehensive technical due diligence** and architecture evaluations for high-stakes acquisitions and investments, identifying critical risks and opportunities that influence strategic business decisions",
          "Deliver expert assessments on **bleeding-edge technology trends** including AI/ML, cloud infrastructure, and enterprise software, enabling clients to navigate rapidly evolving technological landscapes with confidence",
        ],
      },
    ],
  },
  {
    company: "Intuit",
    companyUrl: "https://www.intuit.com",
    location: "Bengaluru, India",
    icon: "/companies/intuit.png",
    techStack: [
      "Swift",
      "Android",
      "Kotlin",
      "Java",
      "SpringBoot",
      "Kafka",
      "Kubernetes",
      "Jenkins",
    ],
    positions: [
      {
        title: "Software Engineer",
        period: "Aug 2020 - May 2021",
        achievements: [
          "Architected and developed **cross-platform mobile applications** (iOS and Android) for Intuit Expert Platform enabling financial professionals to schedule, manage, and track client appointments, resulting in **60% improvement in productivity and response times**",
          "Engineered **mission-critical backend services** with SpringBoot and asynchronous processing using Kafka to support high-throughput data operations for expert-client interactions",
          "Implemented sophisticated **fault-tolerance mechanisms** including circuit breakers, retry strategies, and graceful degradation to ensure application resilience during peak tax seasons",
          "Deployed and maintained microservices in a **container-orchestrated environment** using Kubernetes with comprehensive monitoring, logging, and alerting to ensure 99.9% uptime",
          "Collaborated with UX designers and product managers to continuously refine the expert experience through iterative development and user feedback loops",
        ],
      },
      {
        title: "Software Engineer Intern",
        period: "Jan 2020 - Aug 2020",
        achievements: [
          "Played a pivotal role in the **Android team for Mint**, Intuit's personal finance app used by millions, contributing to both MintLive and Overview Revamp initiatives",
          "Designed and implemented a **comprehensive A/B testing framework** for MintLive that enabled rapid feature experimentation and data-driven product decisions",
          "Spearheaded the **visual refresh of Mint's overview experience** by implementing modern Android architectural patterns including MVVM, data binding, and LiveData",
          "Established **robust testing practices** by creating comprehensive unit test suites with JUnit/Mockito and UI automation tests with Espresso, achieving 85%+ code coverage",
          "Applied advanced **Kotlin features** including coroutines, extension functions, and flow for reactive programming patterns, improving code maintainability and performance",
        ],
      },
    ],
  },
  {
    company: "Samsung Research",
    companyUrl: "https://research.samsung.com",
    location: "Bangalore, India",
    icon: "/companies/samsung.jpg",
    techStack: [
      "Python",
      "TensorFlow",
      "PyTorch",
      "Keras",
      "C++",
      "OpenCV",
      "NumPy",
    ],
    positions: [
      {
        title: "Research Engineer",
        period: "May 2019 - Jul 2019",
        achievements: [
          "Architected an advanced **deep learning-based image denoising system** for ultra-low light photography that achieved 15% quality improvement over Samsung's production pipeline, enhancing night photography capabilities",
          "Engineered novel neural network architecture modifications that **surpassed state-of-the-art models by 7 dB PSNR**, significantly improving perceptual quality through sophisticated fine-tuning techniques and custom loss functions",
          "Conducted extensive **hyperparameter optimization experiments** to identify optimal training configurations, resulting in faster convergence and superior model generalization across diverse lighting conditions",
          "Developed a sophisticated **Python-based CLI automation tool** that reduced environment setup time from minutes to under 5 seconds, dramatically improving team productivity and standardizing development workflows",
          "Collaborated with senior researchers to implement and evaluate multiple **state-of-the-art denoising architectures** including U-Nets, transformers, and attention-based mechanisms for computational photography applications",
        ],
      },
    ],
  },
  {
    company: "Marsview.ai",
    companyUrl: "https://eltropy.com/press/eltropy-acquires-marsview-ai",
    location: "Bangalore, India",
    icon: "/companies/marsview.png",
    techStack: [
      "Python",
      "TensorFlow",
      "Keras",
      "Redis",
      "Android",
      "Kotlin",
      "MongoDB",
      "OpenCV",
    ],
    positions: [
      {
        title: "Research Intern",
        period: "Jul 2017 - Aug 2018",
        achievements: [
          "Architected and implemented advanced **computer vision APIs for Driver Drowsiness Detection** that reduced accident risk by 78% in controlled trials, leveraging CNN-based facial landmark detection",
          "Engineered sophisticated **model optimization techniques** that enabled real-time inference on resource-constrained edge devices like Raspberry Pi 3, achieving sub-100ms latency while maintaining accuracy",
          "Developed a comprehensive **Android native application** with real-time alerting system and companion REST API backend for telemetry logging, statistical analysis, and driver performance tracking",
          "Pioneered a **real-time Automatic Number Plate Recognition (ANPR) system** for Indian license plates achieving 97% accuracy despite challenging variations in plate formats, fonts, and environmental conditions",
          "Implemented custom **OCR algorithms** and **image pre-processing pipelines** that could handle variable lighting conditions, skewed angles, and diverse regional plate formats in CCTV footage",
        ],
      },
    ],
  },
];

export default function Page() {
  return (
    <section className="max-w-2xl mb-8">
      <h1 className="font-medium text-2xl mb-8 tracking-tighter animate-fade-up delay-75">Work</h1>
      <p className="text-base text-muted-foreground mb-8 animate-fade-up delay-150">
        Over the past 5 years, I&apos;ve evolved from a researcher developing
        cutting-edge computer vision systems to leading engineering
        organizations at scale. I&apos;ve architected cloud infrastructures
        handling <strong className="text-foreground font-medium">over 100M daily requests</strong>, pioneered AI
        initiatives, and built cross-platform applications that dramatically
        improved business outcomes. My expertise spans full-stack development,
        deep learning, and distributed systems, with contributions that have
        directly influenced <strong className="text-foreground font-medium">$37M+ in funding</strong>. Whether leading
        world-class engineering teams or providing technical consulting to
        founders & C-suite executives, I consistently deliver solutions that
        combine technical excellence with strategic business value.
      </p>

      <div className="space-y-14 animate-fade-up delay-225">
        {workExperiences.map((company, index) => (
          <div key={index} className="group">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative h-14 md:h-12 aspect-square rounded-md overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={company.icon}
                  alt={`${company.company} logo`}
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="font-medium text-xl">
                  <a
                    href={company.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {company.company}
                  </a>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {company.location}
                </p>
              </div>
            </div>

            {/* Positions using accordion without timeline */}
            <div className="mb-12">
              <Accordion type="single" collapsible className="space-y-1">
                {company.positions.map((position, posIndex) => (
                  <AccordionItem
                    key={posIndex}
                    value={`item-${posIndex}`}
                    className="border-none"
                  >
                    <AccordionTrigger className="py-1 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <h4 className="font-semibold text-lg text-muted-foreground">
                          {position.title}
                        </h4>
                        <span className="text-sm text-muted-foreground tabular-nums mr-2">
                          {position.period}
                        </span>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      <div className="pt-2">
                        <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                          {position.achievements.map((achievement, i) => (
                            <li key={i} className="text-base pl-1">
                              <MDXRemote
                                source={achievement}
                                components={mdxComponents}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Tech Stack section - now at the end */}
            {/* {company.techStack && (
              <div className="ml-2 pl-1 mb-4">
                <h5 className="text-sm font-medium mb-2">Tech Stack</h5>
                <div className="flex flex-wrap gap-2">
                  {company.techStack.map((tech, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )} */}
          </div>
        ))}
      </div>
    </section>
  );
}
