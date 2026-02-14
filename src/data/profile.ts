export const profile = {
  fullName: "Zhiwei Shao",
  shortName: "Zhiwei Shao",
  title: "Ph.D. Candidate in Astronomy",
  institution: "Shanghai Jiao Tong University",
  email: "zwshao@sjtu.edu.cn",
  location: "Shanghai, China",
  bio: "I am a Ph.D. candidate in astronomy working on cosmological simulations, observational cosmology, and galaxy evolution.",
  researchInterests: [
    "Cosmological simulations: AGN and stellar feedback, hydrodynamic solvers",
    "Observational cosmology: halo boundary and large-scale structure",
    "Galaxy evolution: galaxy-halo connection and galaxy quenching"
  ],
  socials: {
    website: "https://zwshao.com",
    googleScholar: "",
    orcid: "https://orcid.org/0000-0002-4585-3985",
    github: "https://github.com/Hoptune",
    linkedin: ""
  },
  cvPdfPath: "/cv.pdf"
} as const;

export type Profile = typeof profile;
