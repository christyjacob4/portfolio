export const metadata = {
  title: "Talks",
  description: "My Talks.",
};

const talks = [
  {
    title: "Introduction to Next.js",
    description: "A beginner-friendly talk on getting started with Next.js for React developers.",
    github: "https://github.com/yourusername/nextjs-intro-talk",
    slides: "https://speakerdeck.com/yourusername/intro-to-nextjs",
    youtube: "https://www.youtube.com/watch?v=example1"
  },
  {
    title: "Advanced React Patterns",
    description: "Exploring complex patterns and best practices in React development.",
    github: "https://github.com/yourusername/advanced-react-patterns",
    slides: "https://speakerdeck.com/yourusername/advanced-react-patterns",
    youtube: "https://www.youtube.com/watch?v=example2"
  },
  {
    title: "Building Scalable APIs with GraphQL",
    description: "Learn how to design and implement scalable APIs using GraphQL.",
    github: "https://github.com/yourusername/graphql-scalable-apis",
    slides: "https://speakerdeck.com/yourusername/scalable-graphql-apis",
    youtube: "https://www.youtube.com/watch?v=example3"
  },
  {
    title: "Introduction to WebRTC",
    description: "Learn how to design and implement scalable APIs using GraphQL.",
    github: "https://github.com/yourusername/graphql-scalable-apis",
    slides: "https://speakerdeck.com/yourusername/scalable-graphql-apis",
    youtube: "https://youtu.be/Rjv-4aT-_8c?t=544"
  }
];

export default function Page() {
  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Talks</h1>
      <div className="space-y-4">
        {talks.map((talk, index) => ( 
          <div key={index} className="border rounded-lg p-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{talk.title}</h2>
            <p className="mb-3">{talk.description}</p>
            <div className="flex space-x-4">
              {talk.github && (
                <a href={talk.github} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                  GitHub
                </a>
              )}
              {talk.slides && (
                <a href={talk.slides} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  Slides
                </a>
              )}
              {talk.youtube && (
                <a href={talk.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                  YouTube
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
