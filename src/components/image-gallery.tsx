"use client";

import Image from "next/image";

export function ImageGallery() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      <Image
        src="/gallery/9.png"
        alt="Gallery Image"
        width={600}
        height={600}
        className="object-cover w-full h-full rounded-lg row-span-2 aspect-square"
      />
      <Image
        src="/gallery/14.png"
        alt="Gallery Image"
        width={600}
        height={600}
        className="object-cover w-full h-72 rounded-lg aspect-square"
      />
      <Image
        src="/gallery/11.png"
        alt="Gallery Image"
        width={600}
        height={600}
        className="object-cover w-full h-full rounded-lg aspect-square"
      />
      <Image
        src="/gallery/12.png"
        alt="Gallery Image"
        width={600}
        height={600}
        className="object-cover w-full h-full rounded-lg aspect-square"
      />
      <Image
        src="/gallery/1.png"
        alt="Gallery Image"
        width={600}
        height={600}
        className="object-cover w-full h-72 rounded-lg aspect-square"
      />
      <Image
        src="/gallery/7.png"
        alt="Gallery Image"
        width={600}
        height={600}
        className="object-cover w-full h-72 md:col-span-2 rounded-lg aspect-square"
      />
      <Image
        src="/gallery/10.png"
        alt="Gallery Image"
        width={600}
        height={600}
        className="object-cover w-full h-full rounded-lg aspect-square"
      />
    </div>
  );
}
