"""
python manage.py seed_jobs

Creates 63 realistic demo jobs across 5 companies, all job types,
all work modes, and every experience level.
"""
from django.core.management.base import BaseCommand
from django.db import transaction

RECRUITERS = [
    {
        'email': 'hr@techcorp.com',
        'full_name': 'Sarah Mitchell',
        'password': 'demo1234',
        'company': {
            'company_name': 'TechCorp Solutions',
            'company_description': 'A leading software consultancy building enterprise solutions for FTSE 100 clients.',
            'industry': 'Software / Technology',
            'company_size': '201-1000',
            'location': 'London, UK',
            'company_website': 'https://techcorp.example.com',
        },
    },
    {
        'email': 'talent@dataventures.io',
        'full_name': 'James Okafor',
        'password': 'demo1234',
        'company': {
            'company_name': 'DataVentures',
            'company_description': 'A data-first startup helping companies make smarter decisions with AI.',
            'industry': 'Data & Analytics',
            'company_size': '11-50',
            'location': 'Manchester, UK',
            'company_website': 'https://dataventures.example.io',
        },
    },
    {
        'email': 'careers@healthtechuk.com',
        'full_name': 'Amira Hassan',
        'password': 'demo1234',
        'company': {
            'company_name': 'HealthTech UK',
            'company_description': 'Building the future of digital healthcare — from NHS integrations to consumer wellness apps.',
            'industry': 'Healthcare Technology',
            'company_size': '51-200',
            'location': 'Birmingham, UK',
            'company_website': 'https://healthtechuk.example.com',
        },
    },
    {
        'email': 'jobs@financehub.co.uk',
        'full_name': 'Marcus Webb',
        'password': 'demo1234',
        'company': {
            'company_name': 'FinanceHub',
            'company_description': 'A fintech scale-up modernising financial infrastructure for banks and insurers.',
            'industry': 'Fintech / Banking',
            'company_size': '51-200',
            'location': 'London, UK',
            'company_website': 'https://financehub.example.co.uk',
        },
    },
    {
        'email': 'hello@creativeagency.co.uk',
        'full_name': 'Priya Nair',
        'password': 'demo1234',
        'company': {
            'company_name': 'CreativeAgency',
            'company_description': 'An award-winning creative studio specialising in brand, digital design, and content.',
            'industry': 'Design & Marketing',
            'company_size': '11-50',
            'location': 'Bristol, UK',
            'company_website': 'https://creativeagency.example.co.uk',
        },
    },
]

CANDIDATES = [
    {
        'email': 'alex.chen@email.com',
        'full_name': 'Alex Chen',
        'password': 'demo1234',
        'profile': {
            'headline': 'Full-Stack Developer | React & Django',
            'bio': '5 years building web applications. Passionate about clean APIs and great UX.',
            'location': 'London, UK',
            'skills': ['Python', 'Django', 'React', 'TypeScript', 'PostgreSQL', 'Docker', 'REST APIs', 'Git'],
            'experience_years': 5,
            'open_to_work': True,
        },
    },
    {
        'email': 'priya.sharma@email.com',
        'full_name': 'Priya Sharma',
        'password': 'demo1234',
        'profile': {
            'headline': 'Data Scientist | ML & NLP Specialist',
            'bio': 'MSc in Data Science. Expert in NLP, scikit-learn, and turning messy data into insights.',
            'location': 'Edinburgh, UK',
            'skills': ['Python', 'Machine Learning', 'NLP', 'scikit-learn', 'TensorFlow', 'SQL', 'Pandas', 'Tableau'],
            'experience_years': 3,
            'open_to_work': True,
        },
    },
    {
        'email': 'tom.walker@email.com',
        'full_name': 'Tom Walker',
        'password': 'demo1234',
        'profile': {
            'headline': 'DevOps Engineer | AWS & Kubernetes',
            'bio': '4 years automating infrastructure. AWS Certified Solutions Architect.',
            'location': 'Bristol, UK',
            'skills': ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Python', 'Linux', 'Jenkins'],
            'experience_years': 4,
            'open_to_work': True,
        },
    },
]

# company_idx: 0=TechCorp, 1=DataVentures, 2=HealthTech, 3=FinanceHub, 4=CreativeAgency
JOBS = [

    # ══════════════════════════════════════════
    # TECHCORP SOLUTIONS (idx 0) — 20 jobs
    # ══════════════════════════════════════════
    {
        'title': 'Senior Full-Stack Developer',
        'description': 'Lead feature development across our React frontend and Django REST backend for enterprise clients used by thousands globally. You will mentor junior engineers and ship every two weeks.',
        'requirements': '• 4+ years full-stack experience\n• Strong React and TypeScript\n• Python/Django backend experience\n• PostgreSQL and Docker knowledge',
        'responsibilities': '• Design and implement features end-to-end\n• Review pull requests\n• Mentor junior developers',
        'skills_required': ['React', 'TypeScript', 'Python', 'Django', 'PostgreSQL', 'Docker'],
        'job_type': 'full_time', 'experience_level': 'senior', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 70000, 'salary_max': 90000,
        'category': 'Software Engineering', 'company_idx': 0,
    },
    {
        'title': 'React Frontend Engineer',
        'description': 'Own the UI of our flagship SaaS product. Build pixel-perfect, accessible interfaces using React 18, TypeScript, Tailwind CSS, and React Query.',
        'requirements': '• 2+ years production React experience\n• Strong TypeScript\n• WCAG 2.1 accessibility knowledge\n• Eye for UI detail',
        'responsibilities': '• Build reusable component library\n• Implement responsive features\n• Optimise Core Web Vitals',
        'skills_required': ['React', 'TypeScript', 'Tailwind CSS', 'JavaScript', 'CSS'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote (UK)', 'salary_min': 55000, 'salary_max': 70000,
        'category': 'Software Engineering', 'company_idx': 0,
    },
    {
        'title': 'Backend Python Developer',
        'description': 'Build and own the Django REST API powering our platform. Write robust tests and help shape backend architecture as we scale to 1M+ users.',
        'requirements': '• 3+ years Python development\n• Django REST Framework\n• Strong PostgreSQL skills\n• Redis and Celery experience',
        'responsibilities': '• Design and maintain REST APIs\n• Optimise slow queries\n• Write comprehensive test suites',
        'skills_required': ['Python', 'Django', 'PostgreSQL', 'Redis', 'Celery', 'REST APIs'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 60000, 'salary_max': 75000,
        'category': 'Software Engineering', 'company_idx': 0,
    },
    {
        'title': 'Junior Software Engineer (Graduate)',
        'description': 'Kick-start your career at TechCorp. You will be paired with a senior mentor and contribute to real features from week one. Structured learning plan included.',
        'requirements': '• CS degree (2:1 or above)\n• Solid programming fundamentals\n• Familiarity with Python or JavaScript\n• Eagerness to learn',
        'responsibilities': '• Contribute to features under mentorship\n• Write unit tests\n• Participate in code reviews',
        'skills_required': ['Python', 'JavaScript', 'Git', 'REST APIs'],
        'job_type': 'full_time', 'experience_level': 'entry', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 32000, 'salary_max': 42000,
        'category': 'Software Engineering', 'company_idx': 0,
    },
    {
        'title': 'DevOps / Platform Engineer',
        'description': 'Own our AWS cloud infrastructure. Build and maintain Kubernetes clusters, CI/CD pipelines, and observability tooling for a platform serving millions of requests daily.',
        'requirements': '• 3+ years DevOps experience\n• Deep AWS experience (EKS, RDS, S3)\n• Kubernetes and Helm\n• Terraform',
        'responsibilities': '• Maintain and scale Kubernetes clusters\n• Build CI/CD pipelines\n• Manage cloud costs',
        'skills_required': ['AWS', 'Kubernetes', 'Terraform', 'Docker', 'CI/CD', 'Linux'],
        'job_type': 'full_time', 'experience_level': 'senior', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 75000, 'salary_max': 95000,
        'category': 'DevOps & Infrastructure', 'company_idx': 0,
    },
    {
        'title': 'iOS Developer (Swift)',
        'description': 'Build and maintain our native iOS app used by 200,000+ users. Work on everything from UI animations to push notifications and offline sync.',
        'requirements': '• 2+ years iOS with Swift\n• SwiftUI and UIKit\n• MVVM/coordinator patterns\n• App Store experience',
        'responsibilities': '• Ship new iOS features\n• Maintain performance\n• Write unit and UI tests',
        'skills_required': ['Swift', 'SwiftUI', 'UIKit', 'iOS', 'Xcode', 'Core Data'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 60000, 'salary_max': 78000,
        'category': 'Mobile Development', 'company_idx': 0,
    },
    {
        'title': 'Android Developer (Kotlin)',
        'description': 'Join a small mobile team building our Android app from scratch. You will own the architecture, implement Material 3 design, and integrate with our REST API.',
        'requirements': '• 2+ years Android with Kotlin\n• Jetpack Compose experience\n• MVVM and clean architecture\n• Google Play deployment experience',
        'responsibilities': '• Build new Android features\n• Write unit and instrumented tests\n• Collaborate with backend on API contracts',
        'skills_required': ['Kotlin', 'Jetpack Compose', 'Android', 'MVVM', 'REST APIs'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote (UK)', 'salary_min': 58000, 'salary_max': 74000,
        'category': 'Mobile Development', 'company_idx': 0,
    },
    {
        'title': 'QA Engineer (Automation)',
        'description': 'Own test quality across our web and mobile platforms. Build automation frameworks, write E2E tests, and work closely with developers to prevent regressions.',
        'requirements': '• 2+ years QA automation\n• Playwright or Cypress experience\n• API testing (Postman, REST Assured)\n• CI/CD integration knowledge',
        'responsibilities': '• Build and maintain E2E test suites\n• Set up test pipelines\n• Report and track bugs',
        'skills_required': ['Playwright', 'Cypress', 'JavaScript', 'API Testing', 'CI/CD', 'Test Automation'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote (UK)', 'salary_min': 48000, 'salary_max': 62000,
        'category': 'Quality Assurance', 'company_idx': 0,
    },
    {
        'title': 'Technical Lead (Full-Stack)',
        'description': 'Lead a squad of 5 engineers delivering a greenfield product. You will set technical direction, run architecture reviews, and stay hands-on with the codebase.',
        'requirements': '• 7+ years software engineering\n• Experience leading a team\n• Deep full-stack knowledge\n• Strong communication skills',
        'responsibilities': '• Set technical direction for the squad\n• Run architecture and design reviews\n• Code alongside the team',
        'skills_required': ['React', 'Python', 'Django', 'PostgreSQL', 'Leadership', 'System Design'],
        'job_type': 'full_time', 'experience_level': 'lead', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 90000, 'salary_max': 115000,
        'category': 'Software Engineering', 'company_idx': 0,
    },
    {
        'title': 'Cybersecurity Analyst',
        'description': 'Protect TechCorp and its clients from threats. You will run vulnerability assessments, respond to incidents, implement security tooling, and advise engineering teams.',
        'requirements': '• 2+ years security experience\n• OSCP, CEH, or similar certification preferred\n• Penetration testing skills\n• SIEM and threat detection tools',
        'responsibilities': '• Conduct vulnerability assessments\n• Monitor for threats\n• Work with engineers on secure coding',
        'skills_required': ['Penetration Testing', 'SIEM', 'Network Security', 'Python', 'Linux', 'OWASP'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 58000, 'salary_max': 75000,
        'category': 'Cybersecurity', 'company_idx': 0,
    },
    {
        'title': 'Freelance React Developer',
        'description': 'Short-term freelance engagement (2–3 months) to help us build a new client-facing dashboard. Fully remote, flexible hours, weekly billing.',
        'requirements': '• Strong React and TypeScript\n• Experience with Chart.js or Recharts\n• Available 4+ days/week\n• Good async communication',
        'responsibilities': '• Build dashboard components\n• Integrate with existing REST API\n• Handover documentation',
        'skills_required': ['React', 'TypeScript', 'JavaScript', 'CSS', 'REST APIs'],
        'job_type': 'freelance', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote', 'salary_min': 400, 'salary_max': 550,
        'category': 'Software Engineering', 'company_idx': 0,
    },
    {
        'title': 'Contract AWS Solutions Architect',
        'description': '6-month contract to design and implement a multi-region AWS architecture for a major client migration. Day rate negotiable based on experience.',
        'requirements': '• AWS Solutions Architect Professional\n• Multi-region architecture experience\n• Terraform and CloudFormation\n• Strong stakeholder communication',
        'responsibilities': '• Design target state AWS architecture\n• Lead migration planning\n• Produce detailed technical documentation',
        'skills_required': ['AWS', 'Terraform', 'CloudFormation', 'Architecture', 'Security'],
        'job_type': 'contract', 'experience_level': 'senior', 'work_mode': 'remote',
        'location': 'Remote', 'salary_min': 600, 'salary_max': 800,
        'category': 'DevOps & Infrastructure', 'company_idx': 0,
    },
    {
        'title': 'Software Engineering Intern (Summer)',
        'description': '12-week paid summer internship for students in their penultimate year. Work on a real feature, get mentored by a senior engineer, and present at the end.',
        'requirements': '• Studying CS, Software Engineering, or related\n• Some programming experience (any language)\n• Curious and communicative',
        'responsibilities': '• Build a defined feature end-to-end\n• Write tests\n• Present findings at intern showcase',
        'skills_required': ['Python', 'JavaScript', 'Git'],
        'job_type': 'internship', 'experience_level': 'entry', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 22000, 'salary_max': 26000,
        'category': 'Software Engineering', 'company_idx': 0,
    },
    {
        'title': 'Part-time Frontend Developer',
        'description': 'We are looking for a part-time (3 days/week) frontend developer to maintain our marketing site and internal tools. Great for someone balancing other commitments.',
        'requirements': '• 2+ years frontend experience\n• React and CSS skills\n• Available 3 days/week consistently',
        'responsibilities': '• Maintain and update marketing website\n• Build internal tooling UI\n• Support design implementation',
        'skills_required': ['React', 'JavaScript', 'CSS', 'HTML', 'Git'],
        'job_type': 'part_time', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote (UK)', 'salary_min': 30000, 'salary_max': 38000,
        'category': 'Software Engineering', 'company_idx': 0,
    },
    {
        'title': 'Technical Writer',
        'description': 'Document our APIs, SDKs, and developer guides. Work closely with engineers to turn complex technical concepts into clear, accurate, developer-friendly documentation.',
        'requirements': '• Proven technical writing experience\n• Ability to read and understand code\n• Experience with Markdown and docs-as-code\n• Strong English writing skills',
        'responsibilities': '• Write and maintain API reference docs\n• Create developer tutorials\n• Review and improve existing documentation',
        'skills_required': ['Technical Writing', 'Markdown', 'REST APIs', 'Git', 'Docs-as-code'],
        'job_type': 'part_time', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote (UK)', 'salary_min': 28000, 'salary_max': 36000,
        'category': 'Technical Writing', 'company_idx': 0,
    },
    {
        'title': 'Contract Backend Developer (Node.js)',
        'description': '3-month contract to help migrate a legacy Node.js service to a modern TypeScript/Express architecture. Fully remote, immediate start.',
        'requirements': '• Strong Node.js and TypeScript\n• Experience with Express or Fastify\n• PostgreSQL and Docker\n• Available immediately',
        'responsibilities': '• Migrate legacy codebase\n• Write tests for migrated services\n• Document architectural decisions',
        'skills_required': ['Node.js', 'TypeScript', 'Express', 'PostgreSQL', 'Docker'],
        'job_type': 'contract', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote', 'salary_min': 450, 'salary_max': 600,
        'category': 'Software Engineering', 'company_idx': 0,
    },
    {
        'title': 'Principal Engineer',
        'description': 'Shape the technical strategy for TechCorp\'s entire engineering organisation. You will set standards, drive adoption of best practices, and work on the hardest problems.',
        'requirements': '• 10+ years software engineering experience\n• Broad full-stack knowledge\n• Experience influencing engineering culture\n• Strong written and verbal communication',
        'responsibilities': '• Set engineering standards and practices\n• Lead architecture reviews across teams\n• Mentor staff engineers and tech leads',
        'skills_required': ['System Design', 'Architecture', 'Leadership', 'Python', 'Cloud', 'Mentoring'],
        'job_type': 'full_time', 'experience_level': 'executive', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 120000, 'salary_max': 150000,
        'category': 'Software Engineering', 'company_idx': 0,
    },
    {
        'title': 'Scrum Master / Agile Coach',
        'description': 'Facilitate agile ceremonies, remove blockers, and help three engineering squads continuously improve how they work. No technical background required, but helpful.',
        'requirements': '• PSM I or CSM certified\n• 2+ years as Scrum Master\n• Experience with Jira and Confluence\n• Strong facilitation skills',
        'responsibilities': '• Facilitate sprints, retrospectives, and planning\n• Coach teams on agile principles\n• Track and report on team metrics',
        'skills_required': ['Scrum', 'Agile', 'Jira', 'Facilitation', 'Coaching'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 50000, 'salary_max': 65000,
        'category': 'Project Management', 'company_idx': 0,
    },
    {
        'title': 'Freelance Mobile App Tester',
        'description': 'Freelance engagement to manually test our iOS and Android apps on real devices before major releases. Flexible timing, pay per release cycle.',
        'requirements': '• Experience with mobile testing\n• Owns iPhone and Android device\n• Can write clear bug reports\n• Available during release windows',
        'responsibilities': '• Execute test plans on iOS and Android\n• File detailed bug reports\n• Regression test fixed issues',
        'skills_required': ['Mobile Testing', 'iOS', 'Android', 'Bug Reporting', 'Test Plans'],
        'job_type': 'freelance', 'experience_level': 'entry', 'work_mode': 'remote',
        'location': 'Remote (UK)', 'salary_min': 150, 'salary_max': 250,
        'category': 'Quality Assurance', 'company_idx': 0,
    },

    # ══════════════════════════════════════════
    # DATAVENTURES (idx 1) — 13 jobs
    # ══════════════════════════════════════════
    {
        'title': 'Data Scientist',
        'description': 'Build ML models that predict customer behaviour, detect anomalies, and optimise pricing for enterprise clients. Take models from prototype to production.',
        'requirements': '• MSc/PhD in Data Science or 3+ years industry\n• Strong Python (pandas, scikit-learn)\n• SQL and large datasets\n• NLP familiarity',
        'responsibilities': '• Build and evaluate ML models\n• Clean and transform datasets\n• Present findings to clients',
        'skills_required': ['Python', 'Machine Learning', 'scikit-learn', 'SQL', 'Pandas', 'NLP'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'Manchester, UK', 'salary_min': 55000, 'salary_max': 72000,
        'category': 'Data Science', 'company_idx': 1,
    },
    {
        'title': 'Machine Learning Engineer',
        'description': 'Bridge data science and engineering. Deploy models at scale, build feature pipelines, and maintain ML infrastructure for enterprise clients.',
        'requirements': '• 2+ years deploying ML in production\n• Strong Python and software engineering\n• MLflow or similar\n• Docker and Kubernetes',
        'responsibilities': '• Productionise data science models\n• Build feature pipelines\n• Monitor model drift',
        'skills_required': ['Python', 'Machine Learning', 'Docker', 'MLflow', 'scikit-learn', 'TensorFlow'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote (UK)', 'salary_min': 65000, 'salary_max': 85000,
        'category': 'Data Science', 'company_idx': 1,
    },
    {
        'title': 'Data Engineer',
        'description': 'Design and build the data infrastructure powering our analytics platform. Own pipelines, warehousing strategy, and real-time streaming.',
        'requirements': '• 3+ years data engineering\n• Expert SQL and Python\n• dbt and Airflow\n• BigQuery or Snowflake',
        'responsibilities': '• Build and maintain ETL/ELT pipelines\n• Design scalable data models\n• Ensure data quality',
        'skills_required': ['Python', 'SQL', 'dbt', 'Airflow', 'BigQuery', 'Kafka'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'Manchester, UK', 'salary_min': 58000, 'salary_max': 76000,
        'category': 'Data Engineering', 'company_idx': 1,
    },
    {
        'title': 'NLP Research Engineer',
        'description': 'Work on cutting-edge NLP problems. Fine-tune LLMs, build information extraction pipelines, and advance our NLP capabilities for enterprise clients.',
        'requirements': '• PhD or strong MSc in NLP or ML\n• HuggingFace Transformers\n• Strong Python and PyTorch\n• Published research a bonus',
        'responsibilities': '• Fine-tune and evaluate language models\n• Build NLP pipelines\n• Publish internal research notes',
        'skills_required': ['NLP', 'Python', 'PyTorch', 'HuggingFace', 'Transformers', 'Machine Learning'],
        'job_type': 'full_time', 'experience_level': 'senior', 'work_mode': 'hybrid',
        'location': 'Manchester, UK', 'salary_min': 80000, 'salary_max': 105000,
        'category': 'Data Science', 'company_idx': 1,
    },
    {
        'title': 'Data Science Intern (6 months)',
        'description': 'A structured 6-month internship. Work on a real project alongside senior data scientists and present your findings at the end.',
        'requirements': '• Studying CS, Mathematics, Statistics, or related\n• Python experience\n• Basic statistics knowledge',
        'responsibilities': '• Explore and clean datasets\n• Build simple ML models\n• Present findings weekly',
        'skills_required': ['Python', 'Statistics', 'Pandas', 'Machine Learning'],
        'job_type': 'internship', 'experience_level': 'entry', 'work_mode': 'hybrid',
        'location': 'Manchester, UK', 'salary_min': 22000, 'salary_max': 26000,
        'category': 'Data Science', 'company_idx': 1,
    },
    {
        'title': 'Business Intelligence Analyst',
        'description': 'Turn data into decisions. Own our Tableau dashboards, define KPIs with product and commercial teams, and run ad-hoc analyses that move the business.',
        'requirements': '• 2+ years BI experience\n• Strong Tableau or Power BI\n• Expert SQL\n• Ability to communicate with non-technical stakeholders',
        'responsibilities': '• Build self-serve dashboards\n• Define and document metrics\n• Run ad-hoc analyses',
        'skills_required': ['Tableau', 'SQL', 'Power BI', 'Excel', 'Data Analysis', 'Stakeholder Management'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'Manchester, UK', 'salary_min': 45000, 'salary_max': 58000,
        'category': 'Data Science', 'company_idx': 1,
    },
    {
        'title': 'Freelance Data Analyst',
        'description': 'We periodically need freelance data analysts for client projects. Flexible engagements ranging from 2 weeks to 3 months. Remote first.',
        'requirements': '• Strong SQL and Python or R\n• Experience with data visualisation\n• Can work independently\n• Good written communication',
        'responsibilities': '• Analyse client datasets\n• Produce insights reports\n• Deliver presentations',
        'skills_required': ['SQL', 'Python', 'Data Visualisation', 'Excel', 'Tableau'],
        'job_type': 'freelance', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote', 'salary_min': 300, 'salary_max': 450,
        'category': 'Data Science', 'company_idx': 1,
    },
    {
        'title': 'Part-time Statistics Consultant',
        'description': 'Provide expert statistical advice on experimental design, A/B testing, and model evaluation. 1–2 days per week ongoing engagement.',
        'requirements': '• MSc or PhD in Statistics or related field\n• Experience with A/B testing\n• R or Python\n• Excellent communication skills',
        'responsibilities': '• Advise on experimental design\n• Review statistical analyses\n• Run training sessions',
        'skills_required': ['Statistics', 'A/B Testing', 'R', 'Python', 'Bayesian Methods'],
        'job_type': 'part_time', 'experience_level': 'senior', 'work_mode': 'remote',
        'location': 'Remote (UK)', 'salary_min': 55000, 'salary_max': 70000,
        'category': 'Data Science', 'company_idx': 1,
    },
    {
        'title': 'Product Manager — Data Platform',
        'description': 'Own the roadmap for DataVentures\' core analytics platform. Work with engineers, data scientists, and enterprise clients to define and ship features.',
        'requirements': '• 3+ years product management in B2B SaaS\n• Technical background helpful\n• User research experience\n• Strong written communication',
        'responsibilities': '• Own and communicate the product roadmap\n• Run discovery with customers\n• Write detailed product specs\n• Track KPIs',
        'skills_required': ['Product Management', 'Agile', 'User Research', 'Roadmapping', 'SQL'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'Manchester, UK', 'salary_min': 65000, 'salary_max': 82000,
        'category': 'Product Management', 'company_idx': 1,
    },
    {
        'title': 'Cloud Infrastructure Engineer (AWS)',
        'description': 'Own DataVentures\' cloud infrastructure. Migrate workloads to AWS, build infrastructure as code, and ensure enterprise-grade reliability and security.',
        'requirements': '• 3+ years cloud infrastructure\n• Deep AWS knowledge (VPC, ECS, RDS, IAM)\n• Terraform expertise\n• Security and compliance awareness (SOC2)',
        'responsibilities': '• Design and maintain AWS infrastructure\n• Write Terraform modules\n• Own incident response',
        'skills_required': ['AWS', 'Terraform', 'Docker', 'Linux', 'Security', 'Networking'],
        'job_type': 'full_time', 'experience_level': 'senior', 'work_mode': 'hybrid',
        'location': 'Manchester, UK', 'salary_min': 80000, 'salary_max': 100000,
        'category': 'DevOps & Infrastructure', 'company_idx': 1,
    },
    {
        'title': 'Contract Data Pipeline Developer',
        'description': '4-month contract to build internal ETL pipelines migrating data from legacy systems into BigQuery. Remote, competitive day rate.',
        'requirements': '• Strong Python and SQL\n• dbt or Airflow experience\n• BigQuery or Snowflake\n• Available within 2 weeks',
        'responsibilities': '• Design and build ETL pipelines\n• Document data models\n• Ensure data quality checks',
        'skills_required': ['Python', 'SQL', 'dbt', 'Airflow', 'BigQuery', 'ETL'],
        'job_type': 'contract', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote', 'salary_min': 400, 'salary_max': 550,
        'category': 'Data Engineering', 'company_idx': 1,
    },
    {
        'title': 'Marketing Manager — Growth',
        'description': 'Lead growth marketing at DataVentures. Own the demand generation strategy, run campaigns, manage paid channels, and grow our pipeline.',
        'requirements': '• 3+ years B2B marketing\n• Track record growing pipeline\n• HubSpot or similar CRM\n• Data-driven mindset',
        'responsibilities': '• Own demand generation\n• Run paid ads (LinkedIn, Google)\n• Manage email nurture campaigns',
        'skills_required': ['B2B Marketing', 'HubSpot', 'SEO', 'Paid Ads', 'Analytics'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'Manchester, UK', 'salary_min': 48000, 'salary_max': 62000,
        'category': 'Marketing', 'company_idx': 1,
    },
    {
        'title': 'Freelance ML Model Evaluator',
        'description': 'Help us evaluate the quality of ML models before client delivery. Flexible work — review reports, run benchmarks, and provide written feedback.',
        'requirements': '• ML background\n• Statistical evaluation knowledge\n• Can work independently and async\n• Detail-oriented',
        'responsibilities': '• Run model benchmarks\n• Review evaluation reports\n• Flag edge cases and failure modes',
        'skills_required': ['Machine Learning', 'Python', 'Statistics', 'Model Evaluation'],
        'job_type': 'freelance', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote', 'salary_min': 250, 'salary_max': 400,
        'category': 'Data Science', 'company_idx': 1,
    },

    # ══════════════════════════════════════════
    # HEALTHTECH UK (idx 2) — 12 jobs
    # ══════════════════════════════════════════
    {
        'title': 'Healthcare Software Engineer',
        'description': 'Build NHS-integrated software that improves patient outcomes. Work on clinical decision support tools, appointment systems, and secure data pipelines.',
        'requirements': '• 2+ years software engineering\n• HL7 FHIR knowledge a plus\n• Django or similar\n• Awareness of data privacy (GDPR, NHS DSP Toolkit)',
        'responsibilities': '• Develop NHS-integrated features\n• Ensure GDPR compliance\n• Write clinical data APIs',
        'skills_required': ['Python', 'Django', 'HL7 FHIR', 'PostgreSQL', 'REST APIs', 'GDPR'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'Birmingham, UK', 'salary_min': 52000, 'salary_max': 68000,
        'category': 'Healthcare Technology', 'company_idx': 2,
    },
    {
        'title': 'Clinical Data Analyst',
        'description': 'Analyse clinical datasets to generate insights that improve patient care pathways. Work with NHS trusts, GPs, and our internal product team.',
        'requirements': '• Background in health informatics, statistics, or related\n• Strong SQL and Python or R\n• NHS data experience preferred\n• Excellent report writing',
        'responsibilities': '• Analyse clinical data\n• Produce insight reports for NHS partners\n• Identify care pathway improvements',
        'skills_required': ['SQL', 'Python', 'R', 'Health Informatics', 'Data Visualisation', 'SNOMED CT'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'Birmingham, UK', 'salary_min': 42000, 'salary_max': 55000,
        'category': 'Healthcare Technology', 'company_idx': 2,
    },
    {
        'title': 'NHS Digital Consultant (Contract)',
        'description': '6-month contract to lead an NHS digital transformation programme. Manage stakeholders, define requirements, and oversee delivery.',
        'requirements': '• NHS digital project experience\n• Strong stakeholder management\n• Agile delivery experience\n• SC clearance or willingness to apply',
        'responsibilities': '• Lead NHS digital transformation workstreams\n• Manage stakeholders\n• Report to board-level sponsors',
        'skills_required': ['NHS', 'Digital Transformation', 'Stakeholder Management', 'Agile', 'Project Management'],
        'job_type': 'contract', 'experience_level': 'senior', 'work_mode': 'hybrid',
        'location': 'Birmingham, UK', 'salary_min': 500, 'salary_max': 650,
        'category': 'Healthcare Technology', 'company_idx': 2,
    },
    {
        'title': 'Medical Imaging AI Engineer',
        'description': 'Develop AI models for medical image analysis — X-ray, MRI, and pathology slide interpretation. Work alongside clinicians to validate model outputs.',
        'requirements': '• MSc or PhD in ML or Computer Vision\n• PyTorch and medical imaging libraries (SimpleITK, nibabel)\n• Publication record a plus\n• Awareness of clinical validation',
        'responsibilities': '• Train and validate medical imaging models\n• Collaborate with clinical partners\n• Write validation reports',
        'skills_required': ['PyTorch', 'Computer Vision', 'Python', 'Medical Imaging', 'Deep Learning', 'CNN'],
        'job_type': 'full_time', 'experience_level': 'senior', 'work_mode': 'remote',
        'location': 'Remote (UK)', 'salary_min': 75000, 'salary_max': 95000,
        'category': 'Healthcare Technology', 'company_idx': 2,
    },
    {
        'title': 'Healthcare Product Manager',
        'description': 'Own the product roadmap for our GP-facing platform. Balance clinical needs, regulatory constraints, and technical feasibility to ship meaningful healthcare tools.',
        'requirements': '• 3+ years product management\n• Healthcare or regulated industry experience\n• Understanding of clinical workflows\n• Strong stakeholder skills',
        'responsibilities': '• Define product roadmap\n• Run discovery with clinicians and patients\n• Write specifications and acceptance criteria',
        'skills_required': ['Product Management', 'Healthcare', 'Agile', 'User Research', 'Roadmapping'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'Birmingham, UK', 'salary_min': 60000, 'salary_max': 78000,
        'category': 'Product Management', 'company_idx': 2,
    },
    {
        'title': 'Pharmacy Systems Developer',
        'description': 'Build and maintain the systems that power digital prescribing and pharmacy integrations. Your work directly improves medication safety for patients.',
        'requirements': '• Software engineering background\n• Experience with healthcare systems a plus\n• HL7 FHIR or similar messaging standards\n• Strong testing discipline',
        'responsibilities': '• Develop pharmacy integration APIs\n• Maintain prescribing workflow software\n• Ensure audit logging and compliance',
        'skills_required': ['Python', 'REST APIs', 'HL7 FHIR', 'PostgreSQL', 'Testing', 'Healthcare'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'Birmingham, UK', 'salary_min': 50000, 'salary_max': 65000,
        'category': 'Healthcare Technology', 'company_idx': 2,
    },
    {
        'title': 'Healthcare Data Scientist',
        'description': 'Use machine learning to predict patient deterioration, hospital admissions, and treatment outcomes. Work with real NHS datasets under strict data governance.',
        'requirements': '• Experience with survival analysis or predictive modelling\n• Python and scikit-learn\n• Understanding of clinical data (ICD-10, SNOMED)\n• GDPR and data governance knowledge',
        'responsibilities': '• Build predictive clinical models\n• Validate models with clinical teams\n• Present findings to NHS partners',
        'skills_required': ['Python', 'Machine Learning', 'Clinical Data', 'GDPR', 'Statistics', 'SQL'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote (UK)', 'salary_min': 55000, 'salary_max': 72000,
        'category': 'Healthcare Technology', 'company_idx': 2,
    },
    {
        'title': 'Digital Health Intern',
        'description': '3-month internship for students interested in the intersection of technology and healthcare. Work on real products used by GPs and patients.',
        'requirements': '• Studying healthcare, CS, or related\n• Interest in digital health\n• Basic Python or programming knowledge',
        'responsibilities': '• Support feature development\n• Research digital health trends\n• Present findings to the team',
        'skills_required': ['Python', 'Research', 'Healthcare', 'Communication'],
        'job_type': 'internship', 'experience_level': 'entry', 'work_mode': 'hybrid',
        'location': 'Birmingham, UK', 'salary_min': 20000, 'salary_max': 24000,
        'category': 'Healthcare Technology', 'company_idx': 2,
    },
    {
        'title': 'Freelance Health Content Writer',
        'description': 'Write clear, evidence-based health content for patients and clinicians. Flexible freelance engagement — articles, blog posts, and in-app guidance copy.',
        'requirements': '• Healthcare or science background\n• Strong writing skills\n• Ability to translate clinical language for patients\n• Experience with evidence-based writing',
        'responsibilities': '• Write patient-facing health articles\n• Produce clinician guidance content\n• Review and update existing content',
        'skills_required': ['Health Writing', 'Content Creation', 'Research', 'Plain English', 'SEO'],
        'job_type': 'freelance', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote', 'salary_min': 200, 'salary_max': 350,
        'category': 'Healthcare Technology', 'company_idx': 2,
    },
    {
        'title': 'Part-time Clinical Systems Trainer',
        'description': 'Train NHS staff on our digital clinical systems. Travel to NHS trusts across the Midlands. 2 days per week, flexible scheduling.',
        'requirements': '• NHS or healthcare background\n• Experience training clinical staff\n• Patient communication skills\n• Full UK driving licence',
        'responsibilities': '• Deliver training sessions at NHS sites\n• Create training materials\n• Gather feedback and improve content',
        'skills_required': ['Training', 'NHS', 'Clinical Systems', 'Communication', 'Presentation'],
        'job_type': 'part_time', 'experience_level': 'mid', 'work_mode': 'onsite',
        'location': 'Birmingham, UK', 'salary_min': 24000, 'salary_max': 32000,
        'category': 'Healthcare Technology', 'company_idx': 2,
    },
    {
        'title': 'Cybersecurity Engineer (Healthcare)',
        'description': 'Ensure our NHS-connected systems meet Cyber Essentials Plus and DSPT requirements. Conduct penetration tests, manage vulnerabilities, and support accreditation.',
        'requirements': '• SC clearance or eligibility\n• Cyber Essentials Plus experience\n• NHS DSP Toolkit knowledge preferred\n• Penetration testing skills',
        'responsibilities': '• Manage DSP Toolkit compliance\n• Run vulnerability assessments\n• Advise development teams',
        'skills_required': ['Cybersecurity', 'NHS', 'DSPT', 'Penetration Testing', 'Compliance', 'ISO 27001'],
        'job_type': 'full_time', 'experience_level': 'senior', 'work_mode': 'hybrid',
        'location': 'Birmingham, UK', 'salary_min': 65000, 'salary_max': 82000,
        'category': 'Cybersecurity', 'company_idx': 2,
    },
    {
        'title': 'UX Researcher — Healthcare',
        'description': 'Understand how clinicians and patients interact with digital health tools. Run discovery research, usability studies, and translate insights into product improvements.',
        'requirements': '• 2+ years UX research experience\n• Experience in regulated or complex domains\n• Interview and usability testing skills\n• Ability to synthesise and communicate findings',
        'responsibilities': '• Run user interviews and usability tests\n• Synthesise research into actionable insights\n• Collaborate with product and design teams',
        'skills_required': ['UX Research', 'User Interviews', 'Usability Testing', 'Synthesis', 'Healthcare'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'Birmingham, UK', 'salary_min': 45000, 'salary_max': 58000,
        'category': 'Design & UX', 'company_idx': 2,
    },

    # ══════════════════════════════════════════
    # FINANCEHUB (idx 3) — 10 jobs
    # ══════════════════════════════════════════
    {
        'title': 'Quantitative Developer',
        'description': 'Build the quantitative systems that power our risk and pricing models. Work alongside quants to translate mathematical models into production-grade Python and C++ code.',
        'requirements': '• Strong Python and/or C++\n• Understanding of financial mathematics\n• Low-latency systems experience a plus\n• Numerical computing (NumPy, SciPy)',
        'responsibilities': '• Implement quantitative models in production\n• Optimise pricing system performance\n• Write comprehensive tests',
        'skills_required': ['Python', 'C++', 'NumPy', 'Finance', 'Risk Modelling', 'Low Latency'],
        'job_type': 'full_time', 'experience_level': 'senior', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 90000, 'salary_max': 130000,
        'category': 'Finance & Fintech', 'company_idx': 3,
    },
    {
        'title': 'Fintech Backend Engineer',
        'description': 'Build the payment and banking infrastructure at the heart of FinanceHub. High-throughput, low-latency systems that process millions of transactions daily.',
        'requirements': '• 4+ years backend engineering\n• Experience with financial systems\n• Strong knowledge of distributed systems\n• Python or Java',
        'responsibilities': '• Build payment processing APIs\n• Ensure PCI-DSS compliance\n• Handle high-throughput transaction processing',
        'skills_required': ['Python', 'Java', 'Distributed Systems', 'Kafka', 'PostgreSQL', 'PCI-DSS'],
        'job_type': 'full_time', 'experience_level': 'senior', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 80000, 'salary_max': 105000,
        'category': 'Finance & Fintech', 'company_idx': 3,
    },
    {
        'title': 'Blockchain Developer',
        'description': 'Build on Ethereum and Solana to create DeFi products and smart contract infrastructure. Work on real assets and real transactions.',
        'requirements': '• Solidity and smart contract development\n• Web3.js or ethers.js\n• Understanding of DeFi protocols\n• Audit mindset and security awareness',
        'responsibilities': '• Write and audit smart contracts\n• Build Web3 integrations\n• Stay current with DeFi developments',
        'skills_required': ['Solidity', 'Ethereum', 'Web3.js', 'Blockchain', 'Smart Contracts', 'DeFi'],
        'job_type': 'full_time', 'experience_level': 'senior', 'work_mode': 'remote',
        'location': 'Remote (UK)', 'salary_min': 85000, 'salary_max': 110000,
        'category': 'Finance & Fintech', 'company_idx': 3,
    },
    {
        'title': 'Risk Systems Analyst',
        'description': 'Own the risk reporting systems that regulators and senior management depend on. Work at the intersection of finance, data, and technology.',
        'requirements': '• Financial risk background\n• Strong SQL and Python\n• Experience with regulatory reporting (Basel, IFRS 9)\n• Analytical mindset',
        'responsibilities': '• Maintain risk reporting systems\n• Run regulatory data validations\n• Support internal and external audits',
        'skills_required': ['SQL', 'Python', 'Risk Management', 'Basel III', 'IFRS 9', 'Regulatory Reporting'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'onsite',
        'location': 'London, UK', 'salary_min': 55000, 'salary_max': 72000,
        'category': 'Finance & Fintech', 'company_idx': 3,
    },
    {
        'title': 'Contract Trading Systems Developer',
        'description': '6-month rolling contract to maintain and enhance our algorithmic trading systems. Immediate start. Competitive day rate. Must be eligible for FCA registration.',
        'requirements': '• Experience with trading systems\n• Strong Python or C++\n• FIX protocol knowledge\n• FCA registration or eligibility',
        'responsibilities': '• Maintain algo trading infrastructure\n• Implement new trading strategies\n• Ensure regulatory compliance',
        'skills_required': ['Python', 'C++', 'FIX Protocol', 'Algorithmic Trading', 'Low Latency'],
        'job_type': 'contract', 'experience_level': 'senior', 'work_mode': 'onsite',
        'location': 'London, UK', 'salary_min': 700, 'salary_max': 950,
        'category': 'Finance & Fintech', 'company_idx': 3,
    },
    {
        'title': 'Payment Systems Engineer',
        'description': 'Build the payment gateway and reconciliation systems processing millions of transactions. Ensure reliability, accuracy, and compliance with PSD2.',
        'requirements': '• 3+ years backend engineering\n• Payment processing experience (Stripe, Adyen, or similar)\n• Strong testing discipline\n• PSD2 awareness',
        'responsibilities': '• Build payment gateway integrations\n• Maintain reconciliation pipelines\n• Ensure PSD2 compliance',
        'skills_required': ['Python', 'Stripe', 'PSD2', 'Payments', 'PostgreSQL', 'REST APIs'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 65000, 'salary_max': 82000,
        'category': 'Finance & Fintech', 'company_idx': 3,
    },
    {
        'title': 'Junior Fintech Developer',
        'description': 'Start your career in one of the most exciting areas of tech. You will work on real financial systems from day one, with structured mentoring and a learning budget.',
        'requirements': '• CS or Mathematics degree\n• Some programming experience\n• Interest in finance and technology\n• Attention to detail',
        'responsibilities': '• Contribute to feature development\n• Write and maintain tests\n• Learn financial domain knowledge',
        'skills_required': ['Python', 'JavaScript', 'SQL', 'Git', 'Testing'],
        'job_type': 'full_time', 'experience_level': 'entry', 'work_mode': 'hybrid',
        'location': 'London, UK', 'salary_min': 35000, 'salary_max': 45000,
        'category': 'Finance & Fintech', 'company_idx': 3,
    },
    {
        'title': 'Finance Intern — Technology',
        'description': '10-week summer internship in our technology division. Work on real fintech challenges alongside experienced engineers and quants.',
        'requirements': '• Studying CS, Mathematics, Finance, or Engineering\n• Analytical mindset\n• Excel or Python skills\n• Interest in financial markets',
        'responsibilities': '• Support technology projects\n• Analyse financial data\n• Present findings to senior stakeholders',
        'skills_required': ['Python', 'Excel', 'Finance', 'Analysis'],
        'job_type': 'internship', 'experience_level': 'entry', 'work_mode': 'onsite',
        'location': 'London, UK', 'salary_min': 24000, 'salary_max': 28000,
        'category': 'Finance & Fintech', 'company_idx': 3,
    },
    {
        'title': 'Freelance Compliance Consultant',
        'description': 'Provide expertise on FCA regulations and compliance framework reviews. Flexible engagement, typically 2–4 weeks per project.',
        'requirements': '• Deep FCA regulatory knowledge\n• Experience with compliance framework assessments\n• Strong written communication\n• FCA registered or previously registered',
        'responsibilities': '• Review compliance frameworks\n• Produce regulatory gap analyses\n• Advise on FCA registration requirements',
        'skills_required': ['FCA Regulation', 'Compliance', 'Financial Services', 'Risk Management', 'Reporting'],
        'job_type': 'freelance', 'experience_level': 'senior', 'work_mode': 'remote',
        'location': 'Remote', 'salary_min': 500, 'salary_max': 750,
        'category': 'Finance & Fintech', 'company_idx': 3,
    },
    {
        'title': 'Financial Data Engineer (Part-time)',
        'description': '3 days per week contract to build and maintain financial data pipelines for regulatory reporting. Flexible scheduling, remote first.',
        'requirements': '• Data engineering experience\n• SQL and Python\n• Financial data (market data, risk data) experience\n• Snowflake or similar cloud warehouse',
        'responsibilities': '• Build regulatory reporting pipelines\n• Maintain data quality checks\n• Document data lineage',
        'skills_required': ['Python', 'SQL', 'Snowflake', 'Financial Data', 'Airflow', 'Data Quality'],
        'job_type': 'part_time', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote (UK)', 'salary_min': 50000, 'salary_max': 65000,
        'category': 'Finance & Fintech', 'company_idx': 3,
    },

    # ══════════════════════════════════════════
    # CREATIVEAGENCY (idx 4) — 8 jobs
    # ══════════════════════════════════════════
    {
        'title': 'Senior UX Designer',
        'description': 'Lead design on our biggest client accounts. From research and wireframes to high-fidelity Figma prototypes. You will mentor junior designers and set the quality bar.',
        'requirements': '• 5+ years product/UX design\n• Strong Figma skills including component libraries\n• Experience running user research\n• Portfolio showing end-to-end process',
        'responsibilities': '• Lead design for key client accounts\n• Run user research and usability testing\n• Mentor junior designers\n• Present to stakeholders',
        'skills_required': ['Figma', 'UX Research', 'Prototyping', 'Design Systems', 'User Testing', 'Accessibility'],
        'job_type': 'full_time', 'experience_level': 'senior', 'work_mode': 'hybrid',
        'location': 'Bristol, UK', 'salary_min': 60000, 'salary_max': 78000,
        'category': 'Design & UX', 'company_idx': 4,
    },
    {
        'title': 'Brand Designer',
        'description': 'Shape the visual identities of startups and scale-ups across the UK. You will own brand projects from brief to delivery, working across logo, colour, typography, and brand guidelines.',
        'requirements': '• Strong brand design portfolio\n• Figma and Adobe Creative Suite\n• Motion design basics a plus\n• Great client communication',
        'responsibilities': '• Lead brand identity projects\n• Present concepts to clients\n• Produce brand guidelines\n• Support campaign design',
        'skills_required': ['Brand Design', 'Figma', 'Adobe Illustrator', 'Adobe Photoshop', 'Typography', 'Motion'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'Bristol, UK', 'salary_min': 42000, 'salary_max': 56000,
        'category': 'Design & UX', 'company_idx': 4,
    },
    {
        'title': 'Freelance Motion Designer',
        'description': 'We regularly need freelance motion designers for social media content, explainer videos, and client brand campaigns. Project-based, fully remote.',
        'requirements': '• Strong After Effects skills\n• Experience with social video formats (Reels, TikTok)\n• Portfolio of motion work\n• Quick turnaround ability',
        'responsibilities': '• Create motion graphics for social and web\n• Animate brand assets\n• Deliver project files for handover',
        'skills_required': ['After Effects', 'Motion Design', 'Premier Pro', 'Figma', 'Animation', 'Social Media'],
        'job_type': 'freelance', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote', 'salary_min': 300, 'salary_max': 500,
        'category': 'Design & UX', 'company_idx': 4,
    },
    {
        'title': 'Content Marketing Manager',
        'description': 'Build and execute a content strategy that drives organic growth for CreativeAgency and our clients. Own the blog, social content, case studies, and email newsletter.',
        'requirements': '• 3+ years content marketing experience\n• Strong writing skills\n• SEO knowledge\n• Experience managing a content calendar across multiple brands',
        'responsibilities': '• Own content strategy and calendar\n• Write and commission blog posts and case studies\n• Manage social media presence\n• Report on content performance',
        'skills_required': ['Content Marketing', 'SEO', 'Copywriting', 'Social Media', 'Analytics', 'HubSpot'],
        'job_type': 'full_time', 'experience_level': 'mid', 'work_mode': 'hybrid',
        'location': 'Bristol, UK', 'salary_min': 38000, 'salary_max': 50000,
        'category': 'Marketing', 'company_idx': 4,
    },
    {
        'title': 'SEO Specialist (Part-time)',
        'description': 'Manage SEO strategy for CreativeAgency and a portfolio of client websites. 2 days per week, flexible. Fully remote.',
        'requirements': '• Proven SEO experience\n• Technical SEO knowledge\n• Ahrefs or SEMrush\n• Can work independently and report clearly',
        'responsibilities': '• Conduct SEO audits\n• Build link acquisition strategies\n• Track rankings and organic traffic\n• Produce monthly reports',
        'skills_required': ['SEO', 'Technical SEO', 'Ahrefs', 'Google Search Console', 'Content Strategy', 'Analytics'],
        'job_type': 'part_time', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote (UK)', 'salary_min': 28000, 'salary_max': 36000,
        'category': 'Marketing', 'company_idx': 4,
    },
    {
        'title': 'Social Media Manager',
        'description': 'Grow and manage social media presence for CreativeAgency and our clients across Instagram, LinkedIn, and TikTok. A creative and analytical role.',
        'requirements': '• 1+ year managing brand social media\n• Video and photo content creation skills\n• Analytics and reporting experience\n• Copywriting ability',
        'responsibilities': '• Create and schedule social content\n• Grow follower counts and engagement\n• Run paid social campaigns\n• Produce monthly analytics reports',
        'skills_required': ['Social Media', 'Instagram', 'LinkedIn', 'TikTok', 'Canva', 'Analytics', 'Copywriting'],
        'job_type': 'full_time', 'experience_level': 'entry', 'work_mode': 'hybrid',
        'location': 'Bristol, UK', 'salary_min': 26000, 'salary_max': 34000,
        'category': 'Marketing', 'company_idx': 4,
    },
    {
        'title': 'Freelance Copywriter',
        'description': 'Write compelling copy for websites, campaigns, and brand launches. We work with exciting clients and need writers who can match brand voice with speed.',
        'requirements': '• Strong copywriting portfolio\n• Experience writing across digital formats\n• Quick and responsive\n• Can take direction and iterate fast',
        'responsibilities': '• Write website and landing page copy\n• Produce ad and campaign copy\n• Develop brand messaging frameworks',
        'skills_required': ['Copywriting', 'Brand Voice', 'Digital Marketing', 'Editing', 'SEO Copywriting'],
        'job_type': 'freelance', 'experience_level': 'mid', 'work_mode': 'remote',
        'location': 'Remote', 'salary_min': 250, 'salary_max': 450,
        'category': 'Marketing', 'company_idx': 4,
    },
    {
        'title': 'Creative Director',
        'description': 'Lead the creative vision of CreativeAgency. You will inspire a team of designers and writers, win pitches, and ensure every piece of work is something to be proud of.',
        'requirements': '• 10+ years creative industry experience\n• Proven track record leading creative teams\n• Strong presentation and client skills\n• Award-winning work preferred',
        'responsibilities': '• Lead creative direction across all accounts\n• Win new business pitches\n• Mentor and inspire the creative team\n• Maintain quality standards',
        'skills_required': ['Creative Direction', 'Brand Strategy', 'Leadership', 'Presentation', 'Design', 'Copywriting'],
        'job_type': 'full_time', 'experience_level': 'executive', 'work_mode': 'onsite',
        'location': 'Bristol, UK', 'salary_min': 90000, 'salary_max': 120000,
        'category': 'Design & UX', 'company_idx': 4,
    },
]

SAMPLE_APPLICATIONS = [
    {'candidate_idx': 0, 'job_title': 'Senior Full-Stack Developer',  'status': 'shortlisted',
     'cover': 'I have 5 years building Django + React applications and would love to bring that to TechCorp.'},
    {'candidate_idx': 0, 'job_title': 'Backend Python Developer',     'status': 'reviewing',
     'cover': 'Python and Django REST Framework are my core stack. I write tests first and care deeply about API design.'},
    {'candidate_idx': 0, 'job_title': 'Freelance React Developer',    'status': 'pending',
     'cover': 'Available for 3 months. React and TypeScript are my daily tools.'},
    {'candidate_idx': 1, 'job_title': 'Data Scientist',               'status': 'interview',
     'cover': 'My MSc focused on NLP and I have production experience with scikit-learn pipelines — this role is a perfect fit.'},
    {'candidate_idx': 1, 'job_title': 'NLP Research Engineer',        'status': 'pending',
     'cover': 'I specialise in NLP and have worked extensively with HuggingFace Transformers.'},
    {'candidate_idx': 1, 'job_title': 'Healthcare Data Scientist',    'status': 'reviewing',
     'cover': 'Keen to apply my ML skills in a healthcare context where the impact is tangible.'},
    {'candidate_idx': 2, 'job_title': 'DevOps / Platform Engineer',   'status': 'offered',
     'cover': 'AWS Certified Solutions Architect with 4 years of Kubernetes experience.'},
    {'candidate_idx': 2, 'job_title': 'Cloud Infrastructure Engineer (AWS)', 'status': 'reviewing',
     'cover': 'Deep Terraform and AWS experience. Managing 200+ resources across 3 production accounts currently.'},
    {'candidate_idx': 2, 'job_title': 'Contract AWS Solutions Architect', 'status': 'shortlisted',
     'cover': 'Available for 6-month engagement. Multi-region migrations are my specialism.'},
]


class Command(BaseCommand):
    help = (
        'Seeds 63 realistic jobs across 5 companies (TechCorp, DataVentures, HealthTech UK, FinanceHub, CreativeAgency).\n\n'
        'All job types: full_time, part_time, contract, freelance, internship\n'
        'All work modes: onsite, remote, hybrid\n'
        'All experience levels: entry, mid, senior, lead, executive\n\n'
        'Demo accounts (password: demo1234):\n'
        '  hr@techcorp.com / talent@dataventures.io / careers@healthtechuk.com\n'
        '  jobs@financehub.co.uk / hello@creativeagency.co.uk\n'
        '  alex.chen@email.com / priya.sharma@email.com / tom.walker@email.com'
    )

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true',
                            help='Delete existing seed data before re-seeding.')

    def handle(self, *args, **options):
        from accounts.models import User, CandidateProfile, RecruiterProfile
        from applications.models import Application, ApplicationStatusHistory
        from jobs.models import Job

        if options['clear']:
            self.stdout.write('Clearing existing seed data…')
            emails = [r['email'] for r in RECRUITERS] + [c['email'] for c in CANDIDATES]
            Application.objects.filter(candidate__email__in=emails).delete()
            Job.objects.filter(recruiter__email__in=emails).delete()
            User.objects.filter(email__in=emails).delete()

        with transaction.atomic():
            # Recruiters
            recruiter_users = []
            for rec in RECRUITERS:
                user, created = User.objects.get_or_create(
                    email=rec['email'],
                    defaults={'full_name': rec['full_name'], 'role': User.RECRUITER}
                )
                if created:
                    user.set_password(rec['password'])
                    user.is_email_verified = True
                    user.save()
                    RecruiterProfile.objects.create(user=user, **rec['company'])
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Recruiter: {user.full_name}'))
                else:
                    self.stdout.write(f'  → Recruiter exists: {user.email}')
                recruiter_users.append(user)

            # Candidates
            candidate_users = []
            for cand in CANDIDATES:
                user, created = User.objects.get_or_create(
                    email=cand['email'],
                    defaults={'full_name': cand['full_name'], 'role': User.CANDIDATE}
                )
                if created:
                    user.set_password(cand['password'])
                    user.is_email_verified = True
                    user.save()
                    CandidateProfile.objects.create(user=user, **cand['profile'])
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Candidate: {user.full_name}'))
                else:
                    self.stdout.write(f'  → Candidate exists: {user.email}')
                candidate_users.append(user)

            # Jobs
            job_map, jobs_created = {}, 0
            for job_data in JOBS:
                recruiter = recruiter_users[job_data.pop('company_idx')]
                company_name = recruiter.recruiter_profile.company_name
                job, created = Job.objects.get_or_create(
                    title=job_data['title'],
                    recruiter=recruiter,
                    defaults={**job_data, 'company_name': company_name},
                )
                job_map[job.title] = job
                if created:
                    jobs_created += 1

            self.stdout.write(self.style.SUCCESS(
                f'  ✓ {jobs_created} jobs created ({len(JOBS) - jobs_created} already existed)'
            ))

            # Applications
            apps_created = 0
            for app_data in SAMPLE_APPLICATIONS:
                candidate = candidate_users[app_data['candidate_idx']]
                job = job_map.get(app_data['job_title'])
                if not job:
                    continue
                app, created = Application.objects.get_or_create(
                    job=job, candidate=candidate,
                    defaults={'status': app_data['status'], 'cover_letter': app_data['cover']}
                )
                if created:
                    ApplicationStatusHistory.objects.create(
                        application=app, from_status='', to_status=Application.PENDING,
                        note='Application submitted', changed_by=candidate,
                    )
                    if app_data['status'] != Application.PENDING:
                        ApplicationStatusHistory.objects.create(
                            application=app, from_status=Application.PENDING,
                            to_status=app_data['status'], note='Status updated by recruiter',
                            changed_by=job.recruiter,
                        )
                    apps_created += 1

            self.stdout.write(self.style.SUCCESS(f'  ✓ {apps_created} applications created'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✅  Seeded {len(JOBS)} jobs across 5 companies!'))
        self.stdout.write('')
        self.stdout.write('  Recruiter logins (password: demo1234):')
        for r in RECRUITERS:
            self.stdout.write(f'    {r["email"]:<40} → {r["company"]["company_name"]}')
        self.stdout.write('')
        self.stdout.write('  Candidate logins (password: demo1234):')
        for c in CANDIDATES:
            self.stdout.write(f'    {c["email"]}')
        self.stdout.write('')
# This file is intentionally left blank - new companies/jobs appended below via patch
