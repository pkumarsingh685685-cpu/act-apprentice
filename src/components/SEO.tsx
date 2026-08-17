import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageMeta {
  title: string;
  description: string;
}

const META_MAP: Record<string, PageMeta> = {
  "/": {
    title: "Act Apprentice Cell Katihar | Northeast Frontier Railway",
    description: "Act Apprentice Cell Katihar portal for apprentice notifications, merit panel, results, circulars and railway apprentice updates.",
  },
  "/about": {
    title: "About Us | Act Apprentice Cell Katihar",
    description: "Learn about the Act Apprentice Cell at Katihar Division of Northeast Frontier Railway, our mission, objectives, and historical background.",
  },
  "/notice-board": {
    title: "Notice Board | Act Apprentice Cell Katihar",
    description: "Stay updated with the latest circulars, notices, and operational announcements from Act Apprentice Cell Katihar.",
  },
  "/notifications": {
    title: "Apprentice Notifications | Act Apprentice Cell Katihar",
    description: "Access current and upcoming Act apprentice recruitment notifications, eligibility guidelines, and application forms.",
  },
  "/sf-generator": {
    title: "Disciplinary SF Forms Generator | Act Apprentice Cell Katihar",
    description: "Utility portal for generating Standard Forms (SF-5, SF-11) for administrative and disciplinary procedures in Indian Railways.",
  },
  "/results": {
    title: "Merit Panels & Results | Act Apprentice Cell Katihar",
    description: "View and download selection results, merit panel listings, document verification schedules, and cut-off marks.",
  },
  "/dar-circulars": {
    title: "D&AR Circulars & Guidelines | Act Apprentice Cell Katihar",
    description: "D&AR (Discipline and Appeal Rules) manuals, reference circulars, and procedural guidelines for employees and candidates.",
  },
  "/act-circulars": {
    title: "Act Apprentice Act Circulars | Act Apprentice Cell Katihar",
    description: "Browse and download statutory notifications, provisions, and circulars concerning the Apprentice Act, 1961.",
  },
  "/contact": {
    title: "Contact & Support | Act Apprentice Cell Katihar",
    description: "Get in touch with the Northeast Frontier Railway Administration, DRM Office (P) Katihar, and Apprentice Cell representatives.",
  },
  "/candidate-login": {
    title: "Candidate Login Portal | Act Apprentice Cell Katihar",
    description: "Access your candidate dashboard, track application status, view allocated training slots, and upload documents.",
  },
  "/ai-search": {
    title: "Smart AI Search Assistant | Act Apprentice Cell Katihar",
    description: "Get helpful assistance using artificial intelligence for searching circulars, forms, names, trades, and notification statuses.",
  },
  "/links": {
    title: "Important Web Links | Act Apprentice Cell Katihar",
    description: "Directories and portal link redirects to Ministry of Railways, NFR Web, RRC, and apprentice registration sites.",
  },
  "/internal-links": {
    title: "Administrative Internal Links | Act Apprentice Cell Katihar",
    description: "Secured administrative links and internal department resource portals for DRM Office staff.",
  },
  "/admin": {
    title: "Admin Access Portal | Act Apprentice Cell Katihar",
    description: "Authorized administrative personnel login for content modification, settings, and database management.",
  },
  "/admin/dashboard": {
    title: "Admin Control Center | Act Apprentice Cell Katihar",
    description: "Secure management dashboard for publishing notifications, managing merit lists, updating settings, and tracking analytics.",
  }
};

export function SEO() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Find matching meta or use default home layout matching
    const currentMeta = { ...(META_MAP[pathname] || META_MAP["/"]) };

    // Dynamically customize title based on tab or active form (SF parameter)
    const qParams = new URLSearchParams(search);
    const tabParam = qParams.get('tab');
    const subParam = qParams.get('sub');
    const sfParam = qParams.get('sf');

    let dynamicTitle = currentMeta.title;

    if (pathname === "/sf-generator") {
      if (tabParam === "CLAIM_TA") {
        dynamicTitle = "TA Claim | Act Apprentice Cell Katihar";
      } else if (tabParam === "PDF_STAMP") {
        dynamicTitle = "PDF Stamp | Act Apprentice Cell Katihar";
      } else if (tabParam === "WORK_ALLOTMENT") {
        dynamicTitle = "APO Work Allotment | Act Apprentice Cell Katihar";
      } else if (tabParam === "OFFICE_ORDERS") {
        dynamicTitle = "Office Orders & Circulars | Act Apprentice Cell Katihar";
      } else if (tabParam === "DAR_SECTION" || !tabParam) {
        if (sfParam) {
          const formattedSf = sfParam.replace('-', ' ');
          dynamicTitle = `${formattedSf} | Act Apprentice Cell Katihar`;
        } else if (subParam === "HQ_MATERIAL") {
          dynamicTitle = "HQ Material | Act Apprentice Cell Katihar";
        } else if (subParam === "INBOX") {
          dynamicTitle = "Inbox | Act Apprentice Cell Katihar";
        } else if (subParam === "DAR_POSITION") {
          dynamicTitle = "DAR Position | Act Apprentice Cell Katihar";
        } else {
          dynamicTitle = "Disciplinary SF Forms Generator | Act Apprentice Cell Katihar";
        }
      }
    }

    // 1. Update Title
    document.title = dynamicTitle;

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
    const canonicalBase = typeof window !== 'undefined' && window.location.origin.includes('web.app')
      ? window.location.origin
      : "https://act-apprentice-64381.web.app";
    const canonicalUrl = `${canonicalBase}${pathname === "/" ? "" : pathname}${search}`;
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
    if (ogTitle) ogTitle.setAttribute("content", dynamicTitle);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", currentMeta.description);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", canonicalUrl);

    // 5. Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute("content", dynamicTitle);

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute("content", currentMeta.description);

    const twitterUrl = document.querySelector('meta[name="twitter:url"]');
    if (twitterUrl) twitterUrl.setAttribute("content", canonicalUrl);

    // Scroll to top on navigation (crucial for SEO crawling indexation)
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, search]);

  return null;
}
