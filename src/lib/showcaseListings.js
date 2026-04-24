const abstractPosterThemes = [
  {
    id: 'halo-orb',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
        <defs>
          <filter id="softBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="58" />
          </filter>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.08" />
            </feComponentTransfer>
          </filter>
          <radialGradient id="orb" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#97b8ff" />
            <stop offset="48%" stop-color="#8ca2f6" />
            <stop offset="72%" stop-color="#8a6fe7" />
            <stop offset="100%" stop-color="#cfcaf6" />
          </radialGradient>
        </defs>
        <rect width="1200" height="1200" fill="#f7f4f1" />
        <circle cx="560" cy="585" r="235" fill="#e47ae6" filter="url(#softBlur)" opacity="0.6" />
        <circle cx="650" cy="615" r="240" fill="#87d8d0" filter="url(#softBlur)" opacity="0.34" />
        <circle cx="600" cy="600" r="270" fill="url(#orb)" filter="url(#softBlur)" opacity="0.96" />
        <rect width="1200" height="1200" filter="url(#grain)" opacity="0.2" />
      </svg>
    `,
  },
  {
    id: 'overlap-discs',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
        <defs>
          <filter id="discBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <linearGradient id="warm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ff79cb" />
            <stop offset="48%" stop-color="#ffb54f" />
            <stop offset="100%" stop-color="#ffc400" />
          </linearGradient>
          <linearGradient id="cool" x1="0%" y1="10%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#dceffd" />
            <stop offset="62%" stop-color="#d9e2dd" />
            <stop offset="100%" stop-color="#ffd1bc" />
          </linearGradient>
        </defs>
        <rect width="1200" height="1200" fill="#eae3dc" />
        <circle cx="470" cy="560" r="260" fill="url(#cool)" filter="url(#discBlur)" opacity="0.94" />
        <circle cx="695" cy="560" r="255" fill="url(#warm)" filter="url(#discBlur)" opacity="0.96" />
      </svg>
    `,
  },
  {
    id: 'soft-blobs',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
        <defs>
          <filter id="blobBlur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="42" />
          </filter>
          <filter id="blobGrain">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" stitchTiles="stitch" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.07" />
            </feComponentTransfer>
          </filter>
        </defs>
        <rect width="1200" height="1200" fill="#f5f2ec" />
        <g filter="url(#blobBlur)" opacity="0.98">
          <path d="M205 275C248 204 344 209 382 280C411 334 414 410 354 441C290 474 211 438 189 374C176 333 183 309 205 275Z" fill="#ffc54f" />
          <path d="M472 258C533 201 621 218 648 302C670 372 637 447 562 463C486 478 428 414 420 348C415 309 434 285 472 258Z" fill="#8bd66d" />
          <path d="M820 243C884 184 975 203 1010 278C1047 359 1008 454 923 476C846 496 763 444 751 366C742 312 774 286 820 243Z" fill="#d454d7" />
          <path d="M213 694C271 626 379 623 438 692C492 754 478 857 406 894C328 931 234 887 200 816C181 776 183 730 213 694Z" fill="#ffb44d" />
          <path d="M495 718C550 651 638 655 688 710C739 765 739 856 671 902C596 953 489 916 456 839C438 798 455 767 495 718Z" fill="#a77df4" />
          <path d="M829 700C886 637 980 648 1028 710C1078 776 1069 873 1000 918C919 971 809 943 772 860C750 811 780 757 829 700Z" fill="#ef7d59" />
        </g>
        <rect width="1200" height="1200" filter="url(#blobGrain)" opacity="0.18" />
      </svg>
    `,
  },
  {
    id: 'contour-fields',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
        <rect width="1200" height="1200" fill="#f6f2ec" />
        <g transform="translate(100 120)">
          <g transform="translate(0 0)">
            <rect width="280" height="280" rx="10" fill="#f4efea" />
            <circle cx="140" cy="140" r="118" fill="#efd8dc" />
            <circle cx="140" cy="140" r="92" fill="#d9bfd2" />
            <circle cx="140" cy="140" r="68" fill="#a885b5" />
            <circle cx="140" cy="140" r="44" fill="#5d4b7f" />
          </g>
          <g transform="translate(360 0)">
            <rect width="280" height="280" rx="10" fill="#f5f2e7" />
            <circle cx="140" cy="140" r="116" fill="#ede2c8" />
            <circle cx="140" cy="140" r="86" fill="#c89d7b" />
            <circle cx="140" cy="140" r="58" fill="#7f475f" />
          </g>
          <g transform="translate(720 0)">
            <rect width="280" height="280" rx="10" fill="#edf5ea" />
            <circle cx="140" cy="140" r="116" fill="#c9dbb7" />
            <circle cx="140" cy="140" r="88" fill="#a68d60" />
            <circle cx="140" cy="140" r="58" fill="#624236" />
          </g>
          <g transform="translate(0 340)">
            <rect width="280" height="280" rx="10" fill="#edf7f4" />
            <circle cx="140" cy="140" r="118" fill="#b8dcc4" />
            <circle cx="140" cy="140" r="90" fill="#7d8955" />
            <circle cx="140" cy="140" r="62" fill="#574632" />
          </g>
          <g transform="translate(360 340)">
            <rect width="280" height="280" rx="10" fill="#ebf5f8" />
            <circle cx="140" cy="140" r="118" fill="#cbe7db" />
            <circle cx="140" cy="140" r="90" fill="#6c955f" />
            <circle cx="140" cy="140" r="62" fill="#365a2d" />
          </g>
          <g transform="translate(720 340)">
            <rect width="280" height="280" rx="10" fill="#eef0f9" />
            <circle cx="140" cy="140" r="118" fill="#c6deeb" />
            <circle cx="140" cy="140" r="90" fill="#6496ad" />
            <circle cx="140" cy="140" r="62" fill="#305a45" />
          </g>
          <g transform="translate(0 680)">
            <rect width="280" height="280" rx="10" fill="#f0eef8" />
            <circle cx="140" cy="140" r="118" fill="#c7c3e4" />
            <circle cx="140" cy="140" r="90" fill="#6f8ed8" />
            <circle cx="140" cy="140" r="62" fill="#20554b" />
          </g>
          <g transform="translate(360 680)">
            <rect width="280" height="280" rx="10" fill="#f8eef4" />
            <circle cx="140" cy="140" r="118" fill="#d8c1eb" />
            <circle cx="140" cy="140" r="90" fill="#7d8ad0" />
            <circle cx="140" cy="140" r="62" fill="#355867" />
          </g>
          <g transform="translate(720 680)">
            <rect width="280" height="280" rx="10" fill="#f7edf1" />
            <circle cx="140" cy="140" r="118" fill="#ebcfe0" />
            <circle cx="140" cy="140" r="90" fill="#a67bc0" />
            <circle cx="140" cy="140" r="62" fill="#524a86" />
          </g>
        </g>
      </svg>
    `,
  },
  {
    id: 'gradient-ribbon',
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200">
        <defs>
          <filter id="ribbonBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="42" />
          </filter>
          <linearGradient id="ribbon" x1="10%" y1="10%" x2="90%" y2="90%">
            <stop offset="0%" stop-color="#f4e76d" />
            <stop offset="26%" stop-color="#b3eb7b" />
            <stop offset="52%" stop-color="#7060f6" />
            <stop offset="76%" stop-color="#ef4eb5" />
            <stop offset="100%" stop-color="#ffb75c" />
          </linearGradient>
        </defs>
        <rect width="1200" height="1200" fill="#f7f5f1" />
        <path d="M310 232C386 166 526 180 568 264C608 345 582 438 632 521C698 630 824 673 891 778C928 836 932 907 880 953C806 1019 664 985 564 923C461 861 379 775 325 682C271 590 236 467 251 355C259 299 276 263 310 232Z" fill="url(#ribbon)" filter="url(#ribbonBlur)" opacity="0.98" />
      </svg>
    `,
  },
]

function toDataUri(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`
}

export const showcaseListings = [
  {
    id: 'mock-01',
    title: 'AI Triage Workflow Design',
    role: 'Clinical AI Engineer',
    city: 'Istanbul',
    tags: ['Emergency', 'Triage'],
    distanceKm: 1.4,
    stage: 'Prototyping',
    desc: 'Seeking clinicians and ML engineers to refine a triage flow for emergency-first screening.',
    summary: 'A fast triage workflow for emergency intake, combining clinical reasoning paths with AI-assisted severity ranking.',
    imageUrl: toDataUri(abstractPosterThemes[0].svg),
    bg: '/assets/mesh_1.png',
  },
  {
    id: 'mock-02',
    title: 'Radiology Assistant Model',
    role: 'Computer Vision Engineer',
    city: 'Ankara',
    tags: ['Radiology', 'Vision'],
    distanceKm: 2.1,
    stage: 'Validation',
    desc: 'Building a multimodal radiology assistant to speed up image review and report drafting.',
    summary: 'A radiology co-pilot concept focused on faster review loops, clearer prioritization, and safer handoff to specialists.',
    imageUrl: toDataUri(abstractPosterThemes[1].svg),
    bg: '/assets/mesh_2.png',
  },
  {
    id: 'mock-03',
    title: 'Cardiology Signal Classifier',
    role: 'ML Researcher',
    city: 'Izmir',
    tags: ['Cardiology', 'Signal'],
    distanceKm: 3.3,
    stage: 'Research',
    desc: 'Exploring wearable-friendly ECG signal models for early event detection and physician review.',
    summary: 'A signal intelligence project for earlier cardiology insights, focused on interpretable alerts and dependable screening.',
    imageUrl: toDataUri(abstractPosterThemes[2].svg),
    bg: '/assets/mesh_3.png',
  },
  {
    id: 'mock-04',
    title: 'NLP for Clinical Notes',
    role: 'NLP Engineer',
    city: 'Bursa',
    tags: ['NLP', 'Clinical'],
    distanceKm: 2.8,
    stage: 'Planning',
    desc: 'Designing note summarization and entity extraction pipelines for busy clinical teams.',
    summary: 'An NLP workflow to turn dense clinical notes into structured insight while preserving medical nuance and traceability.',
    imageUrl: toDataUri(abstractPosterThemes[3].svg),
    bg: '/assets/mesh_4.png',
  },
  {
    id: 'mock-05',
    title: 'MRI Lesion Segmentation',
    role: 'Medical Imaging Engineer',
    city: 'Istanbul',
    tags: ['MRI', 'Segmentation'],
    distanceKm: 4.2,
    stage: 'Testing',
    desc: 'Improving lesion boundary consistency for MRI review with tighter visual quality benchmarks.',
    summary: 'A medical imaging effort aimed at cleaner segmentation masks, faster review cycles, and higher trust in edge cases.',
    imageUrl: toDataUri(abstractPosterThemes[4].svg),
    bg: '/assets/mesh_5.png',
  },
]

export const landingProjects = showcaseListings.map((listing) => ({
  id: listing.id,
  title: listing.title,
  role: listing.role,
  desc: listing.desc,
  stage: listing.stage,
  bg: listing.bg,
}))

export const boardListings = showcaseListings.map((listing) => ({
  id: listing.id,
  title: listing.title,
  role: listing.role,
  city: listing.city,
  tags: listing.tags,
  distanceKm: listing.distanceKm,
  matchScore: Math.max(55, 100 - Math.round(listing.distanceKm * 12)),
  summary: listing.summary,
  imageUrl: listing.imageUrl,
  stage: listing.stage,
}))
