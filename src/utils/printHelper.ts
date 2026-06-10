import React from "react";
import { toast } from "sonner";

export async function triggerPrint({
  contentRef,
  documentTitle,
  onAfterPrint,
}: {
  contentRef: React.RefObject<HTMLDivElement | null>;
  documentTitle: string;
  onAfterPrint?: () => void;
}) {
  const element = contentRef.current;
  if (!element) {
    toast.error("Nothing to print!");
    return;
  }

  try {
    // 1. Create a print container directly under body
    const printContainer = document.createElement("div");
    printContainer.id = "print-container";

    // 2. Clone the element to preserve all styles and inline attributes
    const clone = element.cloneNode(true) as HTMLElement;
    printContainer.appendChild(clone);

    // 3. Append to body so it gets picked up by global print styles
    document.body.appendChild(printContainer);

    // 4. Save original tab title and set custom title for PDF filename
    const originalTitle = document.title;
    document.title = documentTitle;

    // 5. Add custom printing mode class to body
    document.body.classList.add("printing-mode");

    // 6. Trigger native print dialog
    window.print();

    // 7. Cleanup after print dialog moves standard execution forward
    setTimeout(() => {
      document.body.classList.remove("printing-mode");
      printContainer.remove();
      document.title = originalTitle;
      
      // Execute print callback (e.g., prompt for DAR position registration)
      if (onAfterPrint) {
        onAfterPrint();
      }
    }, 500);
  } catch (err) {
    console.error("Print helper error:", err);
    toast.error("Fidelity printing failed. Try opening the app in a new tab!");
  }
}
