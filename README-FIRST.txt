ODISHA SATHI - FINAL PRE-ADSENSE QUALITY CLEANUP
================================================

This package fixes the four issues found in the final live-site audit.

WHAT IS FIXED
-------------
1. Social icons with missing URLs are no longer rendered with unfinished
   "link will be added soon" text. Saved working links still appear normally.
2. Related-post panels use the correct section name (Related Jobs, Related
   Results, Related Admissions, Related Admit Cards & Exams, or Related
   Schemes). Empty related panels and unfinished messages are removed.
3. Incomplete legacy records are excluded from public lists, related links,
   post details, metadata and sitemap.xml. Their Firestore records are not
   deleted and can be completed later from Admin.
4. Default post and social-preview banners use the saved department or
   Odisha Sathi, the real post/exam/course name, clean category names and
   category-appropriate labels. Placeholder and duplicate text is removed.

INSTALLATION
------------
1. Extract this ZIP.
2. Copy the included app, components and lib folders.
3. Paste them into the root of your Odisha Sathi project.
4. Choose "Replace the files in the destination" when Windows asks.
5. Do not delete or replace .env.local.
6. In the project terminal run:

   npm run build

7. If the build succeeds, deploy with:

   git add app components lib
   git commit -m "Complete final AdSense quality cleanup"
   git push origin main

VERIFICATION COMPLETED
----------------------
- TypeScript and production build passed.
- All 33 application routes generated successfully.
- Legacy-filter behavior passed targeted tests.
- The 1200 x 630 Admission preview rendered successfully.
- No Analytics, Search Console, Firebase credential or indexing setup was
  changed by this package.

AFTER DEPLOYMENT
----------------
Check the live Contact, Privacy Policy, one Job post, one Result post, one
Admission post and the Tools pages. Then complete one final live audit before
submitting the site to Google AdSense.
