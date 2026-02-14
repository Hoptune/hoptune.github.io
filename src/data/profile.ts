export const profile = {
  fullName: "Zhiwei Shao",
  shortName: "Zhiwei Shao",
  title: "Ph.D. Candidate in Astronomy",
  institution: "Shanghai Jiao Tong University",
  email: "zwshao@sjtu.edu.cn",
  location: "Shanghai, China",
  bio: "I am a Ph.D. candidate in astronomy working on coobservational cosmology and galaxy evolution.",
  researchInterests: [
    "Observational cosmology",
    "Galaxy-halo connection"
  ],
  socials: {
    website: "https://zwshao.com",
    googleScholar: "https://scholar.google.com/citations?user=rYjyXBQAAAAJ",
    orcid: "https://orcid.org/0000-0002-4585-3985",
    github: "https://github.com/Hoptune",
    linkedin: ""
  },
  photoPath: "/profile.jpg",
  cvPdfPath: "../../cv/cv.pdf"
} as const;

export type Profile = typeof profile;
