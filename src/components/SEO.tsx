import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageMeta {
  title: string;
  description: string;
}

const META_MAP: Record<string, PageMeta> = {
  "/": {
    title: "ACT Apprentice Cell Katihar | Northeast Frontier Railway",
    description: "Official ACT Apprentice Cell Katihar portal for apprentice notifications, merit panel, results, circulars and railway apprentice updates.",
  },
  "/about": {
    title: "About Us | ACT Apprentice Cell Katihar",
    description: "Learn about the ACT Apprentice Cell at Katihar Division of Northeast Frontier Railway, our mission, objectives, and historical background.",
  },
  "/notice-board": {
    title: "Notice Board | ACT Apprentice Cell Katihar",
    description: "Stay updated with the latest circulars, notices, and operational announcements from ACT Apprentice Cell Katihar.",
  },
  "/notifications": {
    title: "Apprentice Notifications | ACT Apprentice Cell Katihar",
    description: "Access current and upcoming ACT apprentice recruitment notifications, eligibility guidelines, and application forms.",
  },
  "/sf-generator": {
    title: "Disciplinary SF Forms Generator | ACT Apprentice Cell Katihar",
    description: "Official utility portal for generating Standard Forms (SF-5, SF-11) for administrative and disciplinary procedures in Indian Railways.",
  },
  "/results": {
    title: "Merit Panels & Results | ACT Apprentice Cell Katihar",
    description: "View and download selection results, merit panel listings, document verification schedules, and cut-off marks.",
  },
  "/dar-circulars": {
    title: "D&AR Circulars & Guidelines | ACT Apprentice Cell Katihar",
    description: "D&AR (Discipline and Appeal Rules) manuals, reference circulars, and procedural guidelines for employees and candidates.",
  },
  "/act-circulars": {
    title: "ACT Apprentice Act Circulars | ACT Apprentice Cell Katihar",
    description: "Browse and download statutory notifications, provisions, and circulars concerning the Apprentice Act, 1961.",
  },
  "/contact": {
    title: "Contact & Support | ACT Apprentice Cell Katihar",
    description: "Get in touch with the Northeast Frontier Railway Administration, DRM Office (P) Katihar, and Apprentice Cell representatives.",
  },
  "/candidate-login": {
    title: "Candidate Login Portal | ACT Apprentice Cell Katihar",
    description: "Access your candidate dashboard, track application status, view allocated training slots, and upload documents.",
  },
  "/ai-search": {
    title: "Smart AI Search Assistant | ACT Apprentice Cell Katihar",
    description: "Get helpful assistance using artificial intelligence for searching circulars, forms, names, trades, and notification statuses.",
  },
  "/links": {
    title: "Important Web Links | ACT Apprentice Cell Katihar",
    description: "Directories and portal link redirects to Ministry of Railways, NFR Web, RRC, and official apprentice registration sites.",
  },
  "/internal-links": {
    title: "Administrative Internal Links | ACT Apprentice Cell Katihar",
    description: "Secured administrative links and internal department resource portals for DRM Office staff.",
  },
  "/admin": {
    title: "Admin Access Portal | ACT Apprentice Cell Katihar",
    description: "Authorized administrative personnel login for content modification, settings, and database management.",
  },
  "/admin/dashboard": {
    title: "Admin Control Center | ACT Apprentice Cell Katihar",
    description: "Secure management dashboard for publishing notifications, managing merit lists, updating settings, and tracking analytics.",
  }
};

export function SEO() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Find matching meta or use default home layout matching
    const currentMeta = META_MAP[pathname] || META_MAP["/"];

    // 1. Update Title
    document.title = currentMeta.title;

    // 2. Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", currentMeta.description);
    } else {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      metaDescription.setAttribute("content", currentMeta.description);
      document.head.appendChild(metaDescription);
    }

    // 3. Update Canonical URL
    const canonicalBase = "https://commanding-encoder-qfbwx.web.app";
    const canonicalUrl = `${canonicalBase}${pathname === "/" ? "" : pathname}`;
    let canonicalLink = document.querySelector('link[id="canonical-link"]') || document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute("href", canonicalUrl);
    } else {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("id", "canonical-link");
      canonicalLink.setAttribute("rel", "canonical");
      canonicalLink.setAttribute("href", canonicalUrl);
      document.head.appendChild(canonicalLink);
    }

    // 4. Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", currentMeta.title);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", currentMeta.description);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", canonicalUrl);

    // 5. Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute("content", currentMeta.title);

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute("content", currentMeta.description);

    const twitterUrl = document.querySelector('meta[name="twitter:url"]');
    if (twitterUrl) twitterUrl.setAttribute("content", canonicalUrl);

    // Scroll to top on navigation (crucial for SEO crawling indexation)
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
