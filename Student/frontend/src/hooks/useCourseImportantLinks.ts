"use client";

import { useCallback, useEffect, useState } from "react";
import {
  COURSE_IMPORTANT_LINKS_UPDATE_EVENT,
  getCourseImportantLinks,
  refreshCourseImportantLinks,
  type CourseImportantLink,
} from "@/lib/courseImportantLinks";

export function useCourseImportantLinks() {
  const [links, setLinks] = useState<CourseImportantLink[]>(() => getCourseImportantLinks());

  const sync = useCallback(() => {
    setLinks(getCourseImportantLinks());
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(COURSE_IMPORTANT_LINKS_UPDATE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COURSE_IMPORTANT_LINKS_UPDATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  return { links, refresh: () => refreshCourseImportantLinks() };
}
