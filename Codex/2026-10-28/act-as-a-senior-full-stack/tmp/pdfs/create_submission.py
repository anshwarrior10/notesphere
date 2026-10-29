from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output' / 'pdf'
OUT.mkdir(parents=True, exist_ok=True)
FONT = Path('C:/Windows/Fonts')
for face, name in [('Arial','arial.ttf'),('Arial-Bold','arialbd.ttf'),('Arial-Italic','ariali.ttf')]:
    pdfmetrics.registerFont(TTFont(face,str(FONT/name)))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='Arial-Bold',italic='Arial-Italic',boldItalic='Arial-Bold')
INK=colors.HexColor('#172236'); BLUE=colors.HexColor('#254bdd'); MUTED=colors.HexColor('#52647e')
BORDER=colors.HexColor('#c9d4e4'); PALE=colors.HexColor('#f3f6fb'); WHITE=colors.white
W,H=A4
TEAM=[('Harmandeep Singh','261010234','Frontend'),('Aahaan Jain','261010201','Frontend'),('Kundan Pathak','261010242','Database Management'),('Sparsh Dwiwedi','261010290','Backend'),('Shreshth Sharma','261010286','Testing and Deployment tools')]
styles={
 'body':ParagraphStyle('body',fontName='Arial',fontSize=9.1,leading=12.3,textColor=INK,spaceAfter=5),
 'small':ParagraphStyle('small',fontName='Arial',fontSize=8,leading=10.5,textColor=INK,spaceAfter=3),
 'tiny':ParagraphStyle('tiny',fontName='Arial',fontSize=7.4,leading=9.3,textColor=MUTED),
 'cell':ParagraphStyle('cell',fontName='Arial',fontSize=8.4,leading=11.1,textColor=INK),
 'th':ParagraphStyle('th',fontName='Arial-Bold',fontSize=7.6,leading=10,textColor=INK),
 'section':ParagraphStyle('section',fontName='Arial-Bold',fontSize=10.5,leading=14,textColor=INK,spaceBefore=8,spaceAfter=7),
 'vbody':ParagraphStyle('vbody',fontName='Arial',fontSize=10.2,leading=14.4,textColor=INK,spaceAfter=8),
 'vsmall':ParagraphStyle('vsmall',fontName='Arial',fontSize=9.2,leading=12.7,textColor=INK,spaceAfter=6),
 'vheading':ParagraphStyle('vheading',fontName='Arial-Bold',fontSize=12,leading=16,textColor=BLUE,spaceBefore=11,spaceAfter=7),
 'quote':ParagraphStyle('quote',fontName='Arial',fontSize=10.5,leading=15.3,textColor=INK),
}
def p(s,style='body'):return Paragraph(s,styles[style])
def gap(h=4):return Spacer(1,h)
def section(s,viva=False):return p(s,'vheading' if viva else 'section')
def bullet(s,viva=False):return p('&#8226; '+s,'vbody' if viva else 'body')
def table(rows,widths,header=True,fs='cell',pad=6):
    data=[[p(str(c),'th' if header and i==0 else fs) for c in row] for i,row in enumerate(rows)]
    t=Table(data,colWidths=widths,hAlign='LEFT')
    settings=[('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.55,BORDER),('LEFTPADDING',(0,0),(-1,-1),pad),('RIGHTPADDING',(0,0),(-1,-1),pad),('TOPPADDING',(0,0),(-1,-1),pad),('BOTTOMPADDING',(0,0),(-1,-1),pad)]
    if header:settings += [('BACKGROUND',(0,0),(-1,0),PALE),('ROWBACKGROUNDS',(0,1),(-1,-1),[WHITE,colors.HexColor('#fafbfd')])]
    else:settings += [('BACKGROUND',(0,0),(-1,-1),PALE)]
    t.setStyle(TableStyle(settings))
    return t
def box(text,width,style='body',padding=9):
    t=Table([[p(text,style)]],colWidths=[width]);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),.6,BORDER),('LINEBEFORE',(0,0),(0,-1),3,BLUE),('LEFTPADDING',(0,0),(-1,-1),padding),('RIGHTPADDING',(0,0),(-1,-1),padding),('TOPPADDING',(0,0),(-1,-1),padding),('BOTTOMPADDING',(0,0),(-1,-1),padding)]));return t
def header(c,doc,kicker,title,subtitle,total=2):
    c.saveState();x=42
    c.setFillColor(BLUE);c.setFont('Arial-Bold',8.1);c.drawString(x,H-37,kicker)
    c.setFillColor(INK);c.setFont('Arial-Bold',15 if len(title)<64 else 12.8);c.drawString(x,H-58,title)
    c.setFillColor(MUTED);c.setFont('Arial',8.1);c.drawString(x,H-73,subtitle)
    c.setStrokeColor(INK);c.setLineWidth(.8);c.line(x,H-82,W-x,H-82)
    c.setStrokeColor(BORDER);c.setLineWidth(.5);c.line(x,36,W-x,36)
    c.setFillColor(MUTED);c.setFont('Arial',7.4);c.drawString(x,23,'NoteSphere | IT Workshop | Local full-stack implementation')
    c.drawRightString(W-x,23,f'Page {doc.page} of {total}')
    c.restoreState()
def build(name,story,page_headers):
    path=OUT/name
    doc=SimpleDocTemplate(str(path),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=95,bottomMargin=48,title=name.replace('.pdf','').replace('-',' ').title(),author='NoteSphere Project Team')
    def onpage(c,d):header(c,d,*page_headers[min(d.page-1,len(page_headers)-1)])
    doc.build(story,onFirstPage=onpage,onLaterPages=onpage)
    r=PdfReader(path);assert len(r.pages)==2,(name,len(r.pages))
    return path

# Updated assessment form: same two-page structure, complete five-person roster.
width=W-84
s=[]
s.append(table([
 ['<b>Group / Batch / Section:</b> DSAI 1st Semester','<b>Project:</b> NoteSphere - Smart Student Notes Sharing Platform'],
 ['<b>Date / Time / Venue:</b> 26/10/2026 | Time: ______<br/>Venue: ______________________________','<b>Demonstration URL:</b> http://127.0.0.1:3000<br/>Localhost; launcher may choose another free port.'],
 ['<b>Repository / Commit:</b> Source maintained locally; repository / commit ID: __________________','<b>Hosting status:</b> Local demonstration. Cloud deployment has not been verified.']
 ],[width*.51,width*.49],False,fs='small',pad=6))
s += [section('1. GROUP MEMBERS &amp; INDIVIDUAL CONTRIBUTIONS')]
s.append(table([['#','STUDENT NAME','ROLL NUMBER','PRIMARY ROLE / WORK DELIVERED']]+[[str(i),f'<b>{n}</b>',r,role] for i,(n,r,role) in enumerate(TEAM,1)],[25,140,84,width-249],pad=6))
s += [section('2. PROJECT SUMMARY'),p('<b>Problem addressed &amp; target users:</b> Academic notes are scattered across chats and personal folders. NoteSphere gives college students a searchable, organized library of PDFs published by administrators, with protected reading access and persistent personal collections.')]
for text in [
 '<b>Account access:</b> Students register and sign in; administrators use a separate portal with invitation-based account creation. Profiles store academic preferences.',
 '<b>Publication:</b> An admin uploads a validated PDF with subject, course, semester and tags. Published community notes become available to students and generate notifications; drafts and private notes stay restricted.',
 '<b>Study workflow:</b> Signed-in students search/filter notes, preview PDFs using PDF.js, download, bookmark, organize collections, and write or update one review per note.',
 '<b>Administration:</b> Admins manage uploads, student records, reports and academic catalog entries. Backend checks enforce roles and ownership.'
]:s.append(p(text,'small'))
s += [section('3. TECHNOLOGY &amp; IMPLEMENTATION CHECKLIST')]
for label,text in [
 ('Front end','Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, custom responsive globals.css, Lucide icons and PDF.js. Accessible forms, dark/light themes and loading/error states.'),
 ('Back end','Node.js runtime with Next.js API route handlers; TypeScript, Zod validation, file-type signature checks, protected PDF storage and student notifications.'),
 ('Database','PostgreSQL via on-disk PGlite locally; SQL migrations, foreign keys, unique constraints and search indexes. Main entities: users, notes, files, reviews, bookmarks, collections and notifications.'),
 ('Authentication / authorization','Custom salted scrypt passwords and database sessions with HttpOnly cookies. Server-side student/admin checks, origin validation and rate limiting; no Google OAuth or Supabase Auth.'),
 ('Testing / delivery','Node test runner (4 unit tests), TypeScript checks and 17 isolated HTTP/database integration checks recorded as passed. Windows .cmd launcher; local offline use after dependency installation. Vercel is unverified.')
]:s.append(p(f'<b>{label}:</b> {text}','small'))
s += [section('4. DEMONSTRATION READINESS &amp; STUDENT DECLARATION')]
checks=['Application runs','UI / API / DB flow shown','CRUD operations shown','Schema / ER diagram ready','Input validation shown','Team ready for viva','Source code available','Test data prepared']
ct=Table([[p('&#9633; '+checks[i],'tiny') for i in range(4)],[p('&#9633; '+checks[i],'tiny') for i in range(4,8)]],colWidths=[width/4]*4)
ct.setStyle(TableStyle([('LEFTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),1),('BOTTOMPADDING',(0,0),(-1,-1),4)]));s.append(ct)
s.append(PageBreak())
s.append(box('<b>Group / Project:</b> DSAI 1st Semester - NoteSphere<br/><b>Evaluator:</b> __________________________ &nbsp; <b>Evaluation date:</b> __________________<br/><b>Scoring bands:</b> Excellent 90-100%; Good 75-89%; Satisfactory 60-74%; Limited 40-59%; Inadequate below 40%. Award whole marks from observed evidence.',width,'small',8))
s.append(section('5. EVALUATION CRITERIA &amp; SCORING RUBRIC'))
rubric=[
 ('Problem definition &amp; scope','Clear purpose, student/admin requirements, appropriate scope and coherent note-sharing workflow.','10'),
 ('Front-end design &amp; usability','Layout, navigation, responsiveness, accessible forms and useful validation feedback.','15'),
 ('Back-end implementation','API handlers, business rules, validation, modular structure and safe errors.','15'),
 ('Database design &amp; operations','Relational schema, constraints, indexed queries and persistent CRUD operations.','15'),
 ('Full-stack integration','Reliable browser-to-API-to-database flow and complete user journeys.','15'),
 ('Security &amp; reliability','Authentication, server-side roles, protected files, safe inputs and secrets.','10'),
 ('Testing &amp; code quality','Unit/integration cases, edge cases, readable source and documentation.','10'),
 ('Live demo, teamwork &amp; viva','Balanced participation, clear individual explanations and accurate answers.','10')]
s.append(table([['#','ASSESSMENT CRITERION','OBSERVABLE EVIDENCE / EXPECTATIONS','MAX','AWARDED']]+[[str(i),f'<b>{a}</b>',b,c,''] for i,(a,b,c) in enumerate(rubric,1)]+[['','<b>TOTAL GROUP SCORE</b>','','<b>100</b>','___ / 100']],[21,124,244,width-445,56],fs='small',pad=5))
s.append(section('6. LIVE DEMONSTRATION &amp; VIVA VERIFICATION LOG'))
for label in ['Create / retrieve / update / delete note-library data','Browser to API to database integration','Invalid input, denied access and error recovery','Source code, database schema and local startup']:
 s.append(p(f'<b>{label}:</b> Outcome / remarks: __________________________________','small'))
s.append(section('7. INDIVIDUAL PARTICIPATION, VIVA NOTES &amp; SIGN-OFF'))
for i,(name,roll,role) in enumerate(TEAM,1):
 s.append(p(f'<b>{i}. {name} ({roll}) - {role}</b><br/>Viva notes / adjustment / sign-off: __________________________________________________','small'))
s.append(p('Evaluator signature: _____________________ &nbsp;&nbsp; Team representative: _____________________','small'))
build('NoteSphere-Project-Submission.pdf',s,[('IT WORKSHOP | FULL-STACK WEB APPLICATION','GROUP PROJECT DEMONSTRATION - STUDENT SUBMISSION','To be completed by the project team prior to evaluation'),('IT WORKSHOP | PROJECT EVALUATION RUBRIC','FACULTY ASSESSMENT & LIVE DEMONSTRATION RECORD','For faculty evaluator use during project defense | Total: 100 marks')])

def viva_start(role,who,speech):
 return [box('<b>'+who+'</b><br/>Project: NoteSphere - Smart Student Notes Sharing Platform',width,'vbody',11),section('Your 45-60 second opening',True),box(speech,width,'quote',12)]
def vtable(rows,widths=None):return table(rows,widths or [137,width-137],fs='vsmall',pad=7)
def qa(q,a):return KeepTogether([p(q,'vheading'),p(a,'vbody')])
def fileline(name,meaning):return p('<b>'+escape(name)+'</b><br/>'+meaning,'vsmall')
def viva_build(filename,story,role):
 return build(filename,story,[('NOTESPHERE | VIVA SPEAKING NOTES',role.upper()+' | CONCEPTS & DEMO','Short speaking guide based on the implemented local application'),('NOTESPHERE | VIVA SPEAKING NOTES',role.upper()+' | QUESTIONS & CODE MAP','Use these answers after rehearsing the actual code and demonstration')])

# Frontend: both students share the same technology guide with distinct speaking portions.
s=viva_start('Frontend','Harmandeep Singh - 261010234 | Aahaan Jain - 261010201',
 '"We are responsible for the frontend of NoteSphere. We use Next.js with React and TypeScript to build the student and admin portals. Tailwind CSS and a custom global CSS file provide the layout, spacing, colors and responsive styles. React state handles forms, search filters, loading indicators and feedback. The UI calls our backend APIs instead of connecting directly to the database. PDF.js displays protected notes inside the browser. Our focus is a consistent interface that students can use easily on desktop and mobile."')
s += [section('What technology is used, and why?',True),vtable([
 ['TECHNOLOGY / FILE','HOW TO EXPLAIN IT'],
 ['Next.js 16 + React 19','Next.js provides routes and page rendering. React builds reusable UI components such as note cards, forms, sidebar and portal screens.'],
 ['TypeScript / TSX','TypeScript adds compile-time type checks. TSX lets us describe HTML-like UI inside React components. The browser ultimately receives HTML, CSS and JavaScript.'],
 ['Tailwind CSS 4 + globals.css','Tailwind is imported into src/app/globals.css. That file also holds custom styles, CSS variables, media queries and theme rules. The project does not use a file named style.css.'],
 ['Lucide + PDF.js','Lucide supplies icons. PDF.js renders PDF pages with navigation, zoom and fullscreen controls.'],
 ['Client state + API calls','React hooks manage local state and fetch data. Async requests update screens without treating browser state as database storage.']
 ]),section('Divide the live explanation',True),bullet('<b>Harmandeep:</b> Explain the landing page, layout, reusable components, sidebar, responsive CSS and light/dark styling.',True),bullet('<b>Aahaan:</b> Explain student/admin forms, search/filter interactions, validation messages, loading/empty states and the PDF viewer.',True),p('<b>Show:</b> switch portals, resize a page, search as a student, open a PDF and save a bookmark. Show the resulting toast or library update.','vsmall'),PageBreak()]
s += [qa('Why use React and Next.js together?','React is the component library. Next.js is the framework around it that provides routing, server rendering and backend route handlers in the same application.'),qa('Is Node.js part of the frontend?','Node.js runs development/build tools and the server. Frontend components run in the browser when they need interaction; Node.js is not the CSS framework or the database.'),qa('How is the page responsive?','CSS flex/grid layouts, media queries and reusable spacing rules adapt the interface to smaller screens. The sidebar can collapse, and controls wrap or stack as space reduces.'),qa('Does hiding the Upload button secure the application?','No. Hiding it improves the student experience. The backend separately checks the authenticated role and rejects student upload requests, even if someone changes the URL or request.'),qa('Where are the important frontend files?','All paths below are relative to outputs/notesphere/ in the delivered project.')]
s += [fileline('src/components/app.tsx','Application shell, navigation and landing page.'),fileline('src/components/auth.tsx','Student/admin sign-in and registration screens.'),fileline('src/components/pages.tsx + src/components/ui.tsx','Functional pages, shared UI, data fetching and toast feedback.'),fileline('src/components/pdf-viewer.tsx + src/app/globals.css','PDF reading controls and the central stylesheet.'),p('<b>Closing line:</b> "Our UI is connected to real API responses; bookmarks, reviews and collections are saved in the database, not just shown as temporary cards."','vsmall')]
viva_build('frontend.pdf',s,'Frontend')

# Backend guide.
s=viva_start('Backend','Sparsh Dwiwedi - 261010290 | Backend',
 '"I am responsible for the backend of NoteSphere. It runs on Node.js using Next.js API route handlers written in TypeScript. The backend validates input with Zod, checks the user session and role, and reads or writes PostgreSQL data. Admins can upload PDFs; students can only access published notes after signing in. Passwords are stored as salted scrypt hashes, and sessions use HttpOnly cookies. PDF files are kept in private local storage, with an authorized API controlling access. The backend also manages reviews, bookmarks, collections and notifications."')
s += [section('The backend stack',True),vtable([
 ['TECHNOLOGY','PURPOSE IN THIS APPLICATION'],
 ['Node.js + Next.js','Node.js is the JavaScript server runtime. Next.js handles HTTP requests through src/app/api/[...path]/route.ts; a separate Express server is not used.'],
 ['TypeScript + Zod','TypeScript checks code during development. Zod validates request values at runtime: email, password length, note metadata, ratings and review text.'],
 ['node:crypto','Generates random identifiers/tokens, hashes passwords with salted scrypt and hashes session tokens before database storage.'],
 ['SQL + database helpers','Parameterized SQL queries use bound values. PGlite runs local PostgreSQL; the pg driver supports an externally configured PostgreSQL server.'],
 ['file-type + node:fs','The server checks PDF contents and size, then writes private document bytes to disk under random storage keys.']
 ]),section('Explain one complete request',True),p('<b>Admin publishes a PDF:</b> Upload form sends multipart data to POST /api/upload. The server checks origin, session and admin role, validates metadata and PDF signatures, checks size/hash, saves bytes and inserts note/file records. A published community note generates student notifications. The response updates the UI.','vbody'),p('<b>Student reads it:</b> An authenticated request to GET /api/notes/:id/file checks access before returning document bytes. A browser URL by itself does not grant file access.','vbody'),PageBreak()]
s += [qa('How do login and logout work?','Login verifies the password against its salted scrypt hash. The server creates a random session token, stores its hash in the sessions table and sets an HttpOnly cookie. Later requests look up the valid session. Logout revokes that session and clears the cookie.'),qa('How are admin accounts protected?','Student registration always creates a student. Admin registration requires an unexpired, unused invitation created by an existing admin. The server consumes that invitation atomically; a request cannot assign its own role.'),qa('What validation happens for uploads?','Only admins can upload. The server checks the content-detected type, PDF header/EOF, size limit and duplicate content hash. The filename extension and browser MIME are not trusted. New uploads are PDF only; the local limit is 20 MB.'),qa('What do 401, 403 and 404 mean here?','401 means sign-in is required. 403 means a role or request-origin check failed. A protected/private note can return 404 to avoid revealing unavailable content. Invalid input returns a safe validation error.'),qa('Does email password recovery work offline?','The reset-token and password-change logic exists. Sending a reset email requires configured SMTP; the offline launcher disables SMTP and cloud services. Do not claim automatic offline email delivery.')]
s += [section('Files and endpoints to show',True),fileline('src/app/api/[...path]/route.ts','HTTP endpoints: /api/login, /api/upload, /api/notes, /api/collections and /api/admin.'),fileline('src/lib/security.ts + src/lib/validation.ts','Sessions, role/access checks, origin validation, rate limiting and Zod schemas.'),fileline('src/lib/storage.ts + src/lib/db.ts + src/lib/notes.ts','Private bytes, database connection helpers and note search/detail queries.'),p('<b>Key distinction:</b> This app uses custom session authentication. It does not use Supabase Auth, Google OAuth or JWT login.','vsmall')]
viva_build('backend.pdf',s,'Backend')

# Database guide.
s=viva_start('Database Management','Kundan Pathak - 261010242 | Database Management',
 '"I am responsible for database management in NoteSphere. We use PostgreSQL, running locally through PGlite with data persisted on disk. The schema separates users, notes, file metadata, reviews, bookmarks and collections. Primary and foreign keys connect records, and unique constraints prevent duplicate bookmarks and multiple active reviews by one student on the same note. PDF bytes are stored outside the database; the files table stores their metadata. Indexed queries support search and filters. Numbered SQL migrations reproduce the schema, and private libraries are restricted by backend ownership checks."')
s += [section('What is the database actually using?',True),p('<b>Local mode:</b> @electric-sql/pglite embeds PostgreSQL in the application process and persists it at .data/postgres/. It is a relational SQL database, not localStorage, SQLite, MongoDB or MySQL. An external PostgreSQL option exists through the pg driver, but it is not needed for this local demo.','vbody'),vtable([
 ['ENTITY / TABLES','WHAT THEY STORE OR CONNECT'],
 ['users, sessions, password_resets','User/profile/role data and password hashes; hashed session/reset tokens and expiry times.'],
 ['departments, courses, subjects','Academic reference data and course/department relationships.'],
 ['notes, files','Note metadata, uploader, subject, visibility/status; storage key, MIME, size and file hash.'],
 ['tags, note_tags','Reusable tags and a many-to-many note/tag relationship.'],
 ['reviews, bookmarks','Student feedback/rating and saved note associations.'],
 ['collections, collection_notes','Private named folders and a many-to-many collection/note relationship.'],
 ['events, notifications, reports','Reading/download events, per-student updates and moderation reports.'],
 ['admin_invitations, migrations','Hashed single-use invitation codes; schema migration history.']
 ]),p('<b>Relationship examples:</b> One user has many notes; one note has many reviews. Many notes can belong to many collections through collection_notes. Notifications point to the recipient user and related note.','vsmall'),PageBreak()]
s += [qa('What makes the schema normalized?','Different concepts have separate tables. Reusable tags are not repeated as columns on every note; note_tags connects them. File metadata is separated from the note record. Keys preserve relationships and reduce inconsistent duplication.'),qa('Which constraints prevent invalid data?','Users have unique emails. reviews has UNIQUE(note_id, user_id), bookmarks has a combined primary key, and collection_notes also has a combined primary key. Rating checks allow 1-5; semester checks allow 1-12. Foreign keys reject broken relationships.'),qa('How does search remain efficient?','A GIN index supports PostgreSQL full-text search over note title, description and topic. Other indexes support visibility/status, subject/semester, owner and event lookups. The query uses websearch_to_tsquery and ranking; this is database search, not AI.'),qa('How are private collections protected?','The API scopes queries to the signed-in owner. SQL tables enable deny-by-default row-level security and revoke public access, but the trusted backend connects as schema owner. Therefore server-side authorization is still essential; do not claim per-user RLS alone enforces the app rules.'),qa('How do deletion and backup work?','Foreign keys use cascades for dependent rows, such as bookmarks and reviews when a note is deleted. File deletion is handled by the backend. Back up both .data/postgres/ and .data/files/ together while the local server is stopped; one PGlite directory must not be shared by multiple app processes.')]
s += [section('Files and commands to show',True),fileline('db/001_initial.sql + db/002_role_portals.sql','Normalized schema, indexes, constraints, reference catalog and admin invitations.'),fileline('db/demo-accounts.sql','Explicit local demo accounts. Stores password hashes; no fabricated notes or ratings.'),fileline('src/lib/db.ts + src/lib/migrations.ts','Local/external connection selection and ordered SQL migration loading.'),p('<b>Command:</b> npm run db:migrate<br/><b>Demo:</b> bookmark once, repeat the action, then sign out/in. Show that only one bookmark exists and it remains saved.','vsmall')]
viva_build('database-management.pdf',s,'Database Management')

# Testing and deployment guide.
s=viva_start('Testing and Deployment','Shreshth Sharma - 261010286 | Testing and Deployment tools',
 '"I am responsible for testing and local delivery of NoteSphere. We use the built-in Node.js test runner through tsx for unit tests, TypeScript for static checks, and an integration script that starts an isolated Next.js server with a separate database. The recorded results show four unit tests and seventeen grouped integration checks passing. These cover both successful workflows and denied access. For demonstration, a Windows command file starts localhost and opens the browser. The current deliverable is local; I will not claim a verified Vercel deployment or email delivery."')
s += [section('Tools and commands to explain',True),vtable([
 ['TOOL / COMMAND','WHAT IT DOES'],
 ['npm test','Runs tsx --test tests/*.test.ts using node:test and node:assert/strict. Tests password hashing, access rules, validation and origin checks. Vitest is not used.'],
 ['npm run typecheck','Runs tsc --noEmit to detect TypeScript errors. Passing this does not prove every runtime behavior.'],
 ['npm run test:flows','Runs scripts/test-flows.ts against an isolated local development server on port 3101 and a separate PGlite directory. It exercises real HTTP/database interactions.'],
 ['Open-NoteSphere.cmd / npm run local','Launches local Next.js via scripts/start-local.mjs, waits for readiness and opens the browser. Keep the command window open; Ctrl+C stops it.'],
 ['npm run build / npm start','Commands for a production build and server. They exist in the project; the latest role tests use development mode, not a verified production deployment.']
 ]),section('A short live test sequence',True),p('1. Sign in as admin and publish a valid PDF.<br/>2. Sign in as one demo student and show the new notification.<br/>3. Search/open the PDF, bookmark it and add it to a collection.<br/>4. Review it, sign out/in, and verify the library persists.<br/>5. Show student upload/admin access is denied and a private draft is unavailable.','vbody'),p('<b>Evidence:</b> docs/TEST-RESULTS.md records 17 grouped role integration checks. Four unit tests and TypeScript checks passed in the project verification. These are recorded results, not a substitute for rehearsing the current machine.','vsmall'),PageBreak()]
s += [qa('What is the difference between unit and integration testing?','Unit tests check small rules in isolation, such as password verification or input validation. Integration tests send real requests through the server and database, such as upload, notification delivery and persistent bookmarks.'),qa('Which negative cases were tested?','Guests cannot retrieve PDFs; students cannot upload or call admin APIs; forged roles are ignored; invalid/reused admin invitations fail; disguised/non-PDF documents are rejected; private drafts remain hidden; cross-site mutation requests fail.'),qa('How do you avoid changing real demo data during tests?','The flow script uses an isolated database and separate server/cache paths. Test passwords are randomized inside that test database. The script does not need a cloud project or the live user database.'),qa('Does localhost need internet?','With Node.js and dependencies already installed, the local launcher works offline using embedded PostgreSQL and disk storage. The initial npm ci installation may require internet. SMTP email and cloud integrations are disabled in this local launcher.'),qa('What if the server does not open?','Read .data/local-launch.log. Verify Node.js and installed dependencies, keep the launcher window open, and use the URL it prints. The launcher searches for a free port from 3000 to 3019 and can reopen its existing instance.'),qa('Has deployment or browser rendering been verified?','The recorded integration suite verifies HTTP responses and database behavior, including returned PDF bytes. It does not establish visual browser rendering, real SMTP delivery or a successful cloud deployment. Vercel configuration is present, but the current demonstration is localhost.')]
s += [section('Files to show',True),fileline('tests/security.test.ts + scripts/test-flows.ts','The actual unit assertions and complete role workflow checks.'),fileline('scripts/start-local.mjs + Start-NoteSphere.cmd','Offline local startup, free-port detection, readiness checks and startup logs.'),p('<b>Honest closing line:</b> "We tested the main role and persistence workflows locally. Cloud hosting and email still need separate configuration and verification."','vsmall')]
viva_build('testing-deployment.pdf',s,'Testing and Deployment')

# Machine checks supplement visual review.
expected={'frontend.pdf':['Harmandeep Singh','261010234','Aahaan Jain','261010201','globals.css'],
          'backend.pdf':['Sparsh Dwiwedi','261010290','Node.js','scrypt'],
          'database-management.pdf':['Kundan Pathak','261010242','PGlite','PostgreSQL'],
          'testing-deployment.pdf':['Shreshth Sharma','261010286','17','node:test']}
for name,terms in expected.items():
    text='\n'.join(page.extract_text() for page in PdfReader(OUT/name).pages)
    for term in terms:assert term in text,(name,term)
text='\n'.join(page.extract_text() for page in PdfReader(OUT/'NoteSphere-Project-Submission.pdf').pages)
for n,r,role in TEAM:
    assert text.count(n)==2,(n,text.count(n))
    assert text.count(r)==2,(r,text.count(r))
for old in ['Satwik','Debabrata','Sridhar','Kunj Patel','Akriti','byg.vercel.app']:
    assert old not in text,old
for path in sorted(OUT.glob('*.pdf')):print(path.name,len(PdfReader(path).pages),'pages',path.stat().st_size,'bytes')
