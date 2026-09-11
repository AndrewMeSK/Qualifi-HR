# PRD — AI Candidate Qualification Platform

---

## 01

#### Overview / Objective

We are building an AI-native candidate qualification platform for technical recruiters. It helps recruiters define what a qualified candidate looks like, identify the strongest matches from their CV pool, and verify whether candidates can actually demonstrate the skills they claim.

The product sits between candidate sourcing and interviewing. It is **not intended to replace an ATS or manage the full hiring workflow**.

**Core value proposition:**

> **Match the CV. Verify the skill. Know who is actually qualified.**

### Core product loop

**Define → Match → Investigate → Verify → Qualify**

---

## 02

#### Problem Statement / Background

Technical recruiters are often responsible for identifying qualified candidates without having the technical expertise required to confidently evaluate every technical requirement.

Through interviews and user research with **10+ recruiters and senior/top hiring managers**, several recurring problems were identified:

* Recruiters frequently depend on hiring managers or technical leads to clarify what they should look for in a candidate.
* Requirements are often communicated conversationally and must then be manually translated into CV-search criteria.
* Recruiters work across multiple systems, CV databases, ATSs, sourcing platforms, email and spreadsheets.
* Existing CV screening approaches can identify candidates who appear relevant on paper, but a CV does not necessarily demonstrate actual technical ability.
* Recruiters can spend significant time screening candidates who ultimately prove unsuitable during technical evaluation.
* A candidate's CV may contain strong claims about technologies, responsibilities or experience that are difficult for a recruiter to independently validate.

This creates a gap between two questions:

> **"Does this candidate's CV look relevant?"**

and

> **"Can this candidate actually demonstrate the skills required for the role?"**

The product addresses both questions separately.

### Core product insight

**CV Match ≠ Verified Skill**

A candidate can have a 96% CV match while demonstrating only 58% of the required technical skills.

The product should make that discrepancy visible rather than hiding it behind a single candidate score.

### What the product is not

The product is not:

* A replacement for an ATS
* A complete recruitment workflow
* An autonomous hiring system
* A sourcing platform
* A generic AI recruiter

It is a **candidate qualification layer** that can eventually integrate with those systems.

---

## 03

#### Goals & Success Metrics

### Goal 1 — Reduce the effort required to define candidate requirements

Recruiters should be able to describe a role conversationally and produce a structured Position Profile without manually configuring every requirement.

**Metrics**

* Time required to create and approve a Position Profile.
* Number of clarification interactions required before approval.
* Percentage of AI-generated requirements accepted without major edits.

---

### Goal 2 — Reduce manual CV screening effort

Recruiters should be able to upload a candidate pool and quickly identify the strongest matches.

**Metrics**

* Time required to identify the initial shortlist.
* Number of CVs manually reviewed before identifying the shortlist.
* Percentage of relevant candidates surfaced by the system during prototype testing.

---

### Goal 3 — Make candidate recommendations explainable

Recruiters should understand why a candidate received a particular score and be able to trace recommendations to evidence in the CV.

**Metrics**

* Percentage of recruiters able to explain a candidate's score.
* Recruiter confidence in recommendations.
* Recruiter acceptance/override rate of AI recommendations.

---

### Goal 4 — Identify discrepancies between CV alignment and demonstrated ability

The product should provide additional signal before recruiters invest interview time.

**Metrics**

* Percentage of tested candidates where verification materially changes the recruiter's initial assessment.
* Average difference between CV Match Score and Verified Skill Score.
* Percentage of recruiters reporting that verification surfaced information they could not confidently determine from the CV.

---

### Goal 5 — Maintain recruiter control

AI should assist qualification rather than independently making hiring decisions.

**Metrics**

* Position Profile AI approval rate.
* Requirement edit/override rate.
* Assessment edit/regeneration rate.
* Percentage of assessments reviewed before being sent.

### Measurement principle

The problem itself has already been researched with 10+ recruiters and senior hiring managers.

The prototype should therefore focus on validating **whether the proposed solution solves the problem**, rather than attempting to re-prove that the problem exists.

Where production benchmarks do not yet exist, prototype testing should establish the baseline.

---

# 04

#### User Stories

## A. Home / Position Profiles

### US-01 — View Position Profiles

As a **technical recruiter**, I want a home page showing all my Position Profiles so that I can quickly access existing roles or create a new one.

**Acceptance Criteria**

* Home page is the default recruiter landing page.
* Existing Position Profiles are displayed.
* Each profile displays:

  * Position name
  * Candidate count
  * Verification/qualification status where available
  * Last updated date
  * Profile status
* Recruiter can open a Position Profile.
* Recruiter can search Position Profiles.
* Recruiter can sort/filter Position Profiles where appropriate.
* Home page contains a prominent **Create Position Profile** button.
* Empty state is provided when no profiles exist.

---

### US-02 — Create Position Profile

As a **technical recruiter**, I want to create a Position Profile so that I can define the requirements for a new role.

**Acceptance Criteria**

* Recruiter can click **Create Position Profile**.
* Recruiter is prompted for the position name/title.
* The system creates a draft Position Profile.
* Recruiter is taken into the Position Profile setup flow.
* Draft profiles can be edited before approval.

---

## B. Position Profile Creation

### US-03 — Start Position Profile with role information

As a **technical recruiter**, I want to provide basic information about a position so that the AI has enough context to start the qualification conversation.

**Acceptance Criteria**

Recruiter can provide relevant information such as:

* Position title
* Seniority
* Location
* Employment type
* Optional initial description/context

The system uses the position title and provided context when starting the AI conversation.

---

### US-04 — Define requirements conversationally

As a **technical recruiter**, I want to describe the role naturally to the AI so that I don't have to manually translate hiring-manager conversations into technical screening criteria.

**Acceptance Criteria**

* Recruiter can communicate with the AI through a conversational interface.
* AI understands the position being created.
* AI extracts requirements from the conversation.
* AI can ask clarifying questions.
* Recruiter can answer in natural language.
* AI updates the structured Position Profile based on the conversation.
* Recruiter can manually edit any generated requirement.

---

### US-05 — Ask requirement clarification questions

As a **technical recruiter**, I want the AI to ask relevant follow-up questions so that ambiguous requirements are clarified before candidates are evaluated.

**Acceptance Criteria**

The AI should ask questions such as:

* What skills are mandatory?
* What are you looking for in this position?
* Which technologies are essential?
* Which technologies are preferred?
* What type of experience matters?
* How important is each requirement?
* What level of technical depth is expected?
* What type of projects should the candidate have worked on?
* Is equivalent experience acceptable?
* Does a specific technology need to be recent/current?
* Are there specific responsibilities the candidate must have previously owned?

The AI should not make unsupported assumptions about requirements.

---

### US-06 — Clarify ambiguous requirements

As a **technical recruiter**, I want the AI to identify ambiguity and ask targeted questions so that the Position Profile reflects the hiring team's actual expectations.

**Example**

Recruiter:

> "We need someone strong in Python, Django and AWS."

AI:

> "Should AWS experience be mandatory, or would equivalent cloud experience be acceptable?"

Recruiter:

> "AWS is preferred. Python and Django are mandatory."

The Position Profile is updated accordingly.

**Acceptance Criteria**

* AI identifies ambiguous requirements.
* AI asks a targeted clarification question.
* Recruiter can confirm, modify or reject the interpretation.
* Confirmed information becomes part of the structured Position Profile.

---

### US-07 — Assign requirement importance

As a **technical recruiter**, I want to classify requirements by importance so that the system understands what matters most.

**Acceptance Criteria**

Supported importance levels:

* Mandatory
* Important
* Preferred
* Nice to have

Recruiter can modify the classification.

---

### US-08 — Assign requirement weights

As a **technical recruiter**, I want to weight requirements so that more important requirements have greater influence on candidate matching.

**Acceptance Criteria**

* Recruiter can configure requirement weights.
* Weights contribute to the CV Match Score.
* Recruiter can edit AI-generated weights.
* The final approved weights are used for candidate matching.

---

### US-09 — Review Position Profile

As a **technical recruiter**, I want to review the AI-generated Position Profile before it affects candidate evaluation so that I remain in control of the criteria.

**Acceptance Criteria**

The review page displays:

* Position information
* Requirements
* Importance
* Weights
* Experience criteria
* Other relevant qualification criteria

Recruiter can:

* Edit
* Delete
* Add
* Reclassify
* Reweight

requirements.

---

### US-10 — Approve Position Profile

As a **technical recruiter**, I want to approve the Position Profile so that the system has a confirmed source of truth for candidate qualification.

**Acceptance Criteria**

* Recruiter explicitly approves the profile.
* Approved profile becomes active.
* Candidate matching uses the approved version.
* Recruiter can later edit the profile.
* Changes to an approved profile are clearly reflected in the candidate evaluation state.

---

## C. Position Workspace

### US-11 — View Position Workspace

As a **technical recruiter**, I want a dedicated workspace for each Position Profile so that all qualification activity for that role is accessible from one place.

**Acceptance Criteria**

The Position Workspace provides access to:

* Position Profile
* Candidates
* Assessments/results
* Relevant qualification information
* Position settings

Primary navigation should make it clear that the recruiter is operating within a specific position.

---

### US-12 — View Position Profile

As a **technical recruiter**, I want to view the approved requirements so that I can understand what the system is using to evaluate candidates.

**Acceptance Criteria**

Recruiter can view:

* Position title
* Requirements
* Importance
* Weights
* Threshold
* Profile status

Recruiter can edit the profile if required.

---

## D. Candidate Import

### US-13 — Add Candidates

As a **technical recruiter**, I want to add candidates to a Position Profile so that I can evaluate them against the approved requirements.

**Acceptance Criteria**

The **Add Candidates** action provides:

* Upload CVs/resumes
* Future connected sources such as LinkedIn/ATS

---

### US-14 — Bulk upload CVs

As a **technical recruiter**, I want to select and upload multiple CVs at once so that I can evaluate an existing candidate pool efficiently.

**Acceptance Criteria**

* Recruiter can select multiple files.
* Recruiter can drag and drop multiple files where supported.
* Each uploaded CV is associated with the current Position Profile.
* Upload progress is visible.
* Processing status is visible.
* Successfully processed CVs appear in the candidate list.
* Failed CVs are identified.
* Recruiter is informed when processing is complete.

---

### US-15 — Handle CV processing states

As a **technical recruiter**, I want to know what is happening to uploaded CVs so that I don't mistake processing delays for missing candidates.

**Acceptance Criteria**

Each CV can have states such as:

**Uploading**

↓

**Processing**

↓

**Processed**

or

**Processing Failed**

The UI clearly communicates the state.

---

### US-16 — Handle invalid or duplicate CVs

As a **technical recruiter**, I want the system to identify problematic CVs so that they do not silently disappear from the workflow.

**Acceptance Criteria**

The system should identify, where technically feasible:

* Unreadable files
* Unsupported formats
* Missing candidate information
* Missing email
* Duplicate CVs

The recruiter is informed of the issue and can take appropriate action.

---

### US-17 — Connect external candidate sources

As a **technical recruiter**, I want to connect external candidate sources so that I can eventually bring candidates into the same qualification workflow.

**Acceptance Criteria**

The architecture should allow future candidate-source integrations.

Potential sources:

* LinkedIn / approved integrations
* ATS
* CV databases
* Job boards

**MVP Requirement**

External integrations are **not required for the initial functional prototype**.

The product may display a future **Connect LinkedIn** entry point to communicate the intended product direction, but the core qualification flow must work through CV upload.

---

## E. CV Intelligence

### US-18 — Extract candidate information

As a **technical recruiter**, I want candidate information extracted from the CV so that I don't have to manually enter it.

**Acceptance Criteria**

The system attempts to extract:

* Name
* Email
* Current role
* Previous roles
* Companies
* Employment dates
* Skills
* Technologies
* Projects
* Responsibilities
* Certifications
* Education
* Relevant experience

Extracted information should remain traceable to the source CV.

---

### US-19 — Identify evidence for requirements

As a **technical recruiter**, I want to see evidence supporting a candidate's requirements so that I can understand the basis of the AI's recommendation.

**Acceptance Criteria**

For each relevant requirement, the system should identify:

* Evidence found
* Evidence source
* Evidence strength

Possible states:

* Strong evidence
* Moderate evidence
* No evidence found

**Important:** No evidence in a CV must not automatically be interpreted as evidence that the candidate lacks the skill.

---

## F. Candidate Matching

### US-20 — Generate CV Match Score

As a **technical recruiter**, I want candidates evaluated against the Position Profile so that I can quickly identify the strongest CV matches.

**Acceptance Criteria**

* Every successfully processed candidate receives a CV Match Score.
* Matching uses the approved Position Profile.
* Requirement importance/weights influence the score.
* Score is visible on the candidate list.
* Score is explained through requirement-level evidence.

---

### US-21 — Set candidate threshold

As a **technical recruiter**, I want to set a minimum match threshold so that I can identify candidates who meet my screening criteria.

**Acceptance Criteria**

* Recruiter can define a threshold.
* Candidates above/below the threshold are clearly distinguished.
* Threshold is configurable.
* Threshold does not represent an objective probability of hiring success.

Example:

**Threshold: 80%**

Sarah — **96% — Above threshold**

Omar — **74% — Below threshold**

---

### US-22 — Explain candidate score

As a **technical recruiter**, I want to understand why a candidate received their score so that I can determine whether I trust the recommendation.

**Acceptance Criteria**

Recruiter can inspect:

* Requirement
* Candidate evidence
* Evidence strength
* Contribution to overall match

Example:

**Python — Strong evidence**

> 6 years of backend development using Python.

---

## G. Candidate List

### US-23 — View candidates

As a **technical recruiter**, I want to see all candidates associated with a Position Profile so that I can manage qualification from one workspace.

**Acceptance Criteria**

Candidate list displays:

* Candidate name
* CV Match Score
* Verified Skill Score, when available
* Assessment status
* Qualification status
* Relevant skills/status indicators

---

### US-24 — Sort candidates

As a **technical recruiter**, I want to sort candidates by qualification signals so that I can prioritize my attention.

**Acceptance Criteria**

Recruiter can sort by:

* CV Match Score
* Verified Skill Score
* Candidate name
* Assessment status
* Relevant qualification status

---

### US-25 — Filter candidates

As a **technical recruiter**, I want to filter candidates by qualification signals so that I can focus on specific groups.

**Acceptance Criteria**

Recruiter can filter by:

* CV Match Score
* Verification Score
* Assessment status
* Skills/requirements
* Above/below threshold
* Awaiting verification
* Significant CV/verification discrepancy

A useful future filter is:

> **High CV Match + Low Verification**

---

## H. Candidate Detail

### US-26 — Review candidate

As a **technical recruiter**, I want to open a candidate's detail page so that I can understand their qualification without manually reviewing multiple sources.

**Acceptance Criteria**

Candidate detail contains:

* Candidate information
* CV
* CV Match Score
* Requirement-level evidence
* Assessment status
* Verification Score
* Verification results
* Skill breakdown
* Notable discrepancies

---

### US-27 — Review source evidence

As a **technical recruiter**, I want to trace AI conclusions back to the candidate's CV so that I can verify the reasoning.

**Acceptance Criteria**

* Evidence is connected to the relevant requirement.
* Recruiter can identify where the evidence came from.
* AI-generated interpretation is visually distinguished from source information.

---

## I. Candidate Verification

### US-28 — Request verification

As a **technical recruiter**, I want to request technical verification for a candidate so that I can validate important skills before investing interview time.

**Acceptance Criteria**

* Recruiter can trigger verification from the candidate detail page.
* Candidate must have a usable Position Profile.
* System uses the approved Position Profile and candidate CV as inputs.
* AI generates a candidate-specific assessment.

---

### US-29 — Generate candidate-specific assessment

As a **technical recruiter**, I want the AI to generate an assessment based on both the role and candidate CV so that the assessment tests relevant skills and validates candidate claims.

**Acceptance Criteria**

Assessment generation uses:

**Position Profile + Candidate CV**

Assessment can include:

* Technical knowledge
* Technical reasoning/scenarios
* Experience/CV verification

Questions should be relevant to the candidate's claimed experience and the role requirements.

Example:

CV claim:

> Designed a high-scale Django API.

Verification question:

> Explain the primary architectural bottleneck you encountered and how you addressed it.

The objective is to verify the claim, not simply test whether the candidate knows the definition of Django.

---

### US-30 — Configure assessment

As a **technical recruiter**, I want to configure the generated assessment so that it reflects the level and requirements of the position.

**Acceptance Criteria**

Recruiter can configure, where supported:

* Number of questions
* Difficulty
* Focus areas
* Time limit
* Passing score

---

### US-31 — Review assessment

As a **technical recruiter**, I want to review the assessment before sending it so that I remain in control of candidate evaluation.

**Acceptance Criteria**

Recruiter can:

* Preview questions
* Edit questions
* Delete questions
* Regenerate questions
* Approve assessment

An assessment cannot be sent before recruiter approval.

---

## J. Assessment Sending

### US-32 — Extract candidate email

As a **technical recruiter**, I want the candidate's email to be extracted from their CV so that I don't need to manually enter it.

**Acceptance Criteria**

* System extracts an email when available.
* Recruiter can review the recipient.
* Missing email is clearly identified.
* Recruiter can provide/correct the email if required.

---

### US-33 — Send assessment

As a **technical recruiter**, I want to send an approved assessment to the candidate so that they can demonstrate the required skills.

**Acceptance Criteria**

* Recruiter reviews recipient.
* Recruiter approves sending.
* Assessment link is generated.
* Sending status is recorded.
* Candidate receives/accesses the assessment.

For the prototype, actual email delivery may be simulated.

---

## K. Candidate Assessment

### US-34 — Access assessment

As a **candidate**, I want to access my assessment through a simple link so that I can complete it without creating a full account.

**Acceptance Criteria**

* Candidate can access the assessment through the provided link.
* Candidate does not need a full candidate portal for the MVP.
* Assessment is associated with the correct Candidate Record.
* Candidate can submit responses.

---

### US-35 — Complete assessment

As a **candidate**, I want to submit my assessment so that my technical ability can be evaluated against the requirements of the position.

**Acceptance Criteria**

* Candidate can answer all required questions.
* Submission is clearly confirmed.
* Assessment status changes to Completed.
* Responses are associated with the candidate and position.

---

## L. Verification Results

### US-36 — Generate Verified Skill Score

As a **technical recruiter**, I want to see how well the candidate demonstrated the required skills so that I can compare demonstrated ability against CV claims.

**Acceptance Criteria**

* Completed assessments receive a Verified Skill Score.
* Score is based on the assessment criteria.
* Results can be broken down by skill.
* Recruiter can inspect supporting evidence.
* Verified Skill Score is separate from CV Match Score.

---

### US-37 — View skill-level verification

As a **technical recruiter**, I want to see verification results by skill so that I understand where the candidate demonstrated strength or weakness.

**Example**

| Skill         | Verification |
| ------------- | -----------: |
| Python        |          94% |
| Django        |          91% |
| AWS           |          86% |
| System Design |          89% |

---

## M. Candidate Record

### US-38 — Maintain Candidate Record

As a **technical recruiter**, I want all qualification information stored in one lightweight Candidate Record so that I can track the candidate's progress through qualification.

**Acceptance Criteria**

Candidate Record stores:

* Name
* Email
* CV
* Position Profile
* CV Match Score
* Assessment
* Assessment status
* Verification Score
* Date sent
* Date completed

The MVP does **not** require a full candidate account or candidate portal.

---

## N. CV vs Verification

### US-39 — Compare CV Match and Verified Skill

As a **technical recruiter**, I want to compare a candidate's CV Match Score with their Verified Skill Score so that I can identify discrepancies between CV claims and demonstrated ability.

**Acceptance Criteria**

* Both scores are displayed independently.
* Significant discrepancies are visually highlighted.
* Recruiter can inspect the requirements contributing to the discrepancy.
* The system does not automatically reject a candidate solely because of a discrepancy.

### Signature example

**Omar**

CV Match: **96%**

Verified Skill: **58%**

> ⚠️ **High CV alignment, but low demonstrated technical proficiency.**

**Sarah**

CV Match: **92%**

Verified Skill: **91%**

> ✅ **Strong CV alignment and demonstrated technical proficiency.**

---

# UX / END-TO-END PRODUCT FLOW

The product should operate as a complete qualification experience rather than a collection of isolated AI features.

## Primary flow

```text id="j31m4k"
HOME
  │
  ├── Existing Position Profiles
  │
  └── + CREATE POSITION PROFILE
             │
             ▼
      POSITION SETUP
             │
             ▼
      AI CONVERSATION
             │
             ├── Recruiter describes role
             ├── AI asks clarifying questions
             ├── Recruiter answers
             └── Requirements become structured
             │
             ▼
      REVIEW POSITION PROFILE
             │
             ├── Edit
             ├── Add
             ├── Delete
             ├── Reweight
             └── Approve
             │
             ▼
      POSITION WORKSPACE
             │
             ├── Position Profile
             └── Candidates
             │
             ▼
      ADD CANDIDATES
             │
             ├── Bulk CV Upload
             │
             └── Future: LinkedIn / ATS
             │
             ▼
      CV PROCESSING
             │
             ├── Processing
             ├── Complete
             └── Failed
             │
             ▼
      CANDIDATE LIST
             │
             ├── CV Match Score
             ├── Evidence
             ├── Filters
             └── Status
             │
             ▼
      CANDIDATE DETAIL
             │
             ├── CV
             ├── Requirements
             ├── Evidence
             └── Verify Skills
             │
             ▼
      ASSESSMENT GENERATION
             │
             ▼
      ASSESSMENT REVIEW
             │
             ├── Edit
             ├── Regenerate
             └── Approve
             │
             ▼
      SEND ASSESSMENT
             │
             ▼
      CANDIDATE ASSESSMENT
             │
             ▼
      ASSESSMENT COMPLETED
             │
             ▼
      VERIFICATION RESULTS
             │
             ├── Verified Skill Score
             ├── Skill breakdown
             └── Supporting evidence
             │
             ▼
      CV VS VERIFICATION
             │
             ▼
      QUALIFIED SHORTLIST
```

---

# Candidate Lifecycle

A candidate should have a clear state throughout the product.

```text id="v8g53c"
Imported
   ↓
Processing
   ↓
Matched
   ↓
Reviewed
   ↓
Selected for Verification
   ↓
Assessment Draft
   ↓
Assessment Approved
   ↓
Assessment Sent
   ↓
Assessment Opened
   ↓
Assessment Completed
   ↓
Verified
```

Potential exception states:

```text id="s3p5lq"
Processing Failed
Missing Email
Assessment Expired
Assessment Cancelled
```

The exact lifecycle states can be refined with design/engineering.

---

# Position Profile Lifecycle

```text id="2i2h4t"
Draft
  ↓
AI Conversation
  ↓
Ready for Review
  ↓
Approved
  ↓
Active
  ↓
Updated
```

An approved profile should not silently change.

If requirements are modified after candidates have been evaluated, the product should make the change clear and engineering should determine whether existing candidate scores need to be recalculated.

---

# Assessment Lifecycle

```text id="0p4zks"
Draft
  ↓
AI Generated
  ↓
Recruiter Review
  ↓
Approved
  ↓
Sent
  ↓
Opened
  ↓
Completed
  ↓
Evaluated
```

---

# Empty, Loading & Error States

The prototype should include the important states necessary for a believable product.

## Home

**Empty**

> "Create your first Position Profile."

**Loading**

> Loading Position Profiles...

---

## Position Profile

**Draft**

> Continue defining your requirements.

**Waiting for approval**

> Review your Position Profile before adding candidates.

---

## Candidate List

**No candidates**

> "No candidates have been added yet."

CTA:

**+ Add Candidates**

---

## CV Processing

**Processing**

> "Analyzing 24 resumes..."

**Partial failure**

> "21 resumes processed. 3 require attention."

---

## Candidate

**No verification**

> "This candidate has not completed skill verification."

CTA:

**Verify Skills**

---

## Assessment

**Draft**

> "AI-generated assessment requires recruiter review."

**Sent**

> "Assessment sent to candidate."

**Completed**

> "Assessment completed. Results are ready."

---

# Navigation Structure

The product should maintain a simple information architecture.

```text id="7e9x0f"
Home
│
├── Position Profiles
│
└── Position Profile
      │
      ├── Overview
      ├── Candidates
      └── Position Profile
```

Within Candidate Detail:

```text id="2k0v6x"
Candidate
│
├── Overview
├── CV
├── Match Evidence
├── Assessment
└── Verification Results
```

The exact navigation pattern can be finalized during wireframing.

---

## 05

#### Wireframes

**Status: To be created during design/prototyping.**

The PRD should contain direct links to the Figma file and prototype once created.

### Required screens

### 1. Home / Position Profiles

Must include:

* Position Profile list
* Search/filter
* Position metadata
* Candidate count
* Status
* Last updated
* **Create Position Profile**

---

### 2. Create Position Profile

Must include:

* Position name
* Initial role information
* Start AI conversation

---

### 3. AI Position Conversation

Must show:

* Conversation
* AI questions
* Recruiter responses
* Structured Position Profile being built

The recruiter should be able to see the requirements being generated rather than waiting until the end to discover what the AI understood.

---

### 4. Position Profile Review

Must include:

* Requirements
* Importance
* Weights
* Threshold
* Edit/add/delete
* Approve

---

### 5. Position Workspace

Must provide access to:

* Position information
* Candidates
* Position Profile
* Candidate count
* Qualification status

---

### 6. Add Candidates

Must include:

* Bulk CV upload
* Multiple file selection
* Drag & drop
* Future integration entry points

Potential future CTA:

**Connect LinkedIn**

---

### 7. CV Processing

Must show:

* Upload status
* Processing status
* Success
* Failure
* Missing information

---

### 8. Candidate List

Must include:

* Candidate
* CV Match Score
* Verification Score
* Assessment status
* Qualification status
* Filters
* Sorting

---

### 9. Candidate Detail

Must include:

* Candidate information
* CV
* Match score
* Requirement evidence
* Verification status
* Verify Skills CTA

---

### 10. Assessment Generation

Must show:

* AI-generated questions
* Requirements being tested
* Candidate CV claims being verified

---

### 11. Assessment Review

Must allow:

* Preview
* Edit
* Delete
* Regenerate
* Approve

---

### 12. Candidate Assessment

Simple candidate-facing experience.

No full candidate portal is required.

---

### 13. Assessment Results

Must include:

* Verified Skill Score
* Skill-level results
* Assessment responses/evidence
* Completion status

---

### 14. Qualification Comparison

Must make the central product insight immediately visible:

**CV Match**

vs.

**Verified Skill**

with supporting evidence.

---

**Figma:** `[Add Figma link]`

**Prototype:** `[Add prototype link]`

---

## 06

#### System & Flow Diagram

### High-level system flow

```text id="1qf9s0"
                 ┌───────────────────────┐
                 │        Recruiter      │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │  Position Profile UI  │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ Conversational AI     │
                 │ Requirement Capture   │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ Structured Position   │
                 │ Profile               │
                 └───────────┬───────────┘
                             │
                      Recruiter Approval
                             │
                             ▼
                 ┌───────────────────────┐
                 │ Candidate Import      │
                 │                       │
                 │ CV Upload / Future    │
                 │ Connected Sources     │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ CV Extraction         │
                 │ & Evidence Mapping    │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ Candidate Matching    │
                 │ Engine                │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ CV Match Score +      │
                 │ Evidence              │
                 └───────────┬───────────┘
                             │
                      Recruiter Review
                             │
                             ▼
                 ┌───────────────────────┐
                 │ Verification          │
                 │ Assessment Generator  │
                 └───────────┬───────────┘
                             │
                      Recruiter Approval
                             │
                             ▼
                 ┌───────────────────────┐
                 │ Candidate Assessment  │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ Assessment Evaluation │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ Verified Skill Score  │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌───────────────────────┐
                 │ CV Match vs Verified │
                 │ Skill                 │
                 └───────────────────────┘
```

---

# Core Data Relationship

```text id="o0z2h9"
Position Profile
│
├── Requirements
│     ├── Skill
│     ├── Experience
│     ├── Importance
│     └── Weight
│
└── Candidates
      │
      ├── CV
      │
      ├── Extracted Information
      │
      ├── Evidence
      │
      ├── CV Match Score
      │
      ├── Assessment
      │
      └── Verified Skill Score
```

---

# Core AI Inputs and Outputs

## Position Profile AI

**Input**

* Position name
* Recruiter conversation
* Existing requirements/context

**Output**

* Structured requirements
* Importance
* Suggested weights
* Clarifying questions

---

## Matching AI

**Input**

* Approved Position Profile
* Candidate CV
* Extracted candidate information

**Output**

* CV Match Score
* Requirement-level evidence
* Evidence strength
* Candidate ranking

---

## Assessment AI

**Input**

* Approved Position Profile
* Candidate CV
* Candidate evidence

**Output**

* Candidate-specific assessment
* Questions mapped to requirements
* CV verification questions

---

## Evaluation AI

**Input**

* Assessment
* Candidate responses
* Assessment criteria

**Output**

* Verified Skill Score
* Skill-level results
* Supporting evidence
* Potential discrepancies

---

# Decision Points

The product deliberately separates AI actions from recruiter decisions.

### Position definition

**AI generates → Recruiter approves**

### Candidate matching

**AI recommends → Recruiter reviews**

### Assessment generation

**AI generates → Recruiter edits/approves**

### Assessment sending

**Recruiter approves → System sends**

### Candidate qualification

**AI provides evidence → Recruiter decides**

Core principle:

> **AI recommends. Evidence explains. Recruiter decides.**

---

# 07

#### Technical Notes *(optional)*

**Status: To be completed with engineering.**

No technical implementation details should be treated as final until reviewed with engineering.

### Dependencies

Engineering input is required for:

* CV parsing/extraction
* LLM provider
* Structured AI outputs
* Assessment evaluation
* File storage
* Authentication/authorization
* Database
* Email delivery
* Hosting/deployment

---

### AI architecture considerations

Engineering should determine:

* Model/provider selection
* Prompt architecture
* Structured output approach
* Context/window requirements
* CV processing strategy
* Assessment generation architecture
* Assessment evaluation approach
* Model fallback strategy
* AI cost per candidate
* Evaluation methodology

---

### Data

Core entities are expected to include:

**Position**

* ID
* Title
* Role information
* Requirements
* Threshold
* Status
* Created/updated dates

**Requirement**

* ID
* Position ID
* Name
* Category
* Importance
* Weight
* Description

**Candidate**

* ID
* Position ID
* Name
* Email
* CV
* Match Score
* Verification Score
* Status

**Evidence**

* Candidate ID
* Requirement ID
* Source
* Evidence
* Strength

**Assessment**

* Candidate ID
* Position ID
* Questions
* Status
* Responses
* Score
* Skill scores

The exact schema should be confirmed by engineering.

---

### Performance

To be defined with engineering based on expected MVP volume:

* Maximum CV file size
* Maximum number of CVs per upload
* Expected CV processing time
* Assessment generation time
* Concurrent processing requirements
* AI request limits

---

### Error handling

The system should not silently fail.

Important error states include:

* CV cannot be parsed
* Missing candidate email
* Duplicate candidate
* AI requirement generation failure
* AI assessment generation failure
* Assessment delivery failure
* Assessment evaluation failure

The user should always receive an actionable state where possible.

---

### Data & privacy

The product processes candidate CVs and assessment responses.

Engineering/product should therefore define:

* Data retention
* Candidate data deletion
* Access control
* Storage security
* Auditability
* AI provider data handling
* Candidate consent/notification requirements where applicable

---

### Explainability

AI-generated qualification outputs should retain their supporting evidence.

A recruiter should be able to understand:

1. Which requirement was evaluated.
2. What candidate evidence was found.
3. Where the evidence came from.
4. How that evidence contributed to the recommendation.

---

### Human oversight

The product should maintain human approval at consequential points:

**Position Profile → Assessment → Sending → Qualification**

The system should not make or communicate an autonomous hiring decision.

---

# MVP Scope

The MVP is complete when a recruiter can perform the complete qualification loop:

> **Define → Match → Investigate → Verify → Qualify**

The recruiter must be able to:

1. Open the Home page.
2. View existing Position Profiles.
3. Create a new Position Profile.
4. Enter the position name.
5. Discuss the position with AI.
6. Answer AI clarification questions.
7. Review structured requirements.
8. Edit requirements.
9. Set importance/weights.
10. Approve the Position Profile.
11. Enter the Position Workspace.
12. Bulk upload multiple CVs.
13. See CV processing status.
14. Review processed candidates.
15. Receive CV Match Scores.
16. Inspect evidence supporting the scores.
17. Sort/filter candidates.
18. Open Candidate Detail.
19. Select a candidate for verification.
20. Generate a candidate-specific assessment.
21. Review/edit the assessment.
22. Approve the assessment.
23. Extract/review candidate email.
24. Send or simulate sending the assessment.
25. Candidate accesses and completes the assessment.
26. Receive a Verified Skill Score.
27. Review skill-level verification.
28. Compare CV Match against Verified Skill.
29. Identify discrepancies.
30. Build a qualified shortlist.

---

# MVP vs Future Integrations

## MVP

**Candidate input**

* Bulk CV upload
* Multiple selection
* Drag & drop

## Future

**Candidate input**

* LinkedIn / approved integrations
* ATS
* CV databases
* Job boards

The **Add Candidates** experience should be designed so that additional sources can be added later without redesigning the qualification workflow.

---

# Out of Scope

The MVP will not include:

* Full ATS functionality
* Job board
* Recruitment CRM
* Interview scheduling
* Offer management
* Onboarding
* Payroll
* Candidate portal/account
* Background checks
* LinkedIn scraping
* Full sourcing automation
* Automated hiring decisions
* Personality inference
* Emotion detection
* "Culture fit" inference
* Autonomous candidate rejection

---

# Research Findings vs Product Hypotheses

## Validated through research

Based on interviews/user research with 10+ recruiters and senior/top hiring managers:

* Recruiters can struggle to confidently evaluate technical requirements.
* Recruiters depend on hiring managers/technical leads for requirement clarification.
* Role requirements often need to be translated from conversational language into screening criteria.
* Recruiters operate across fragmented recruiting tools.
* CVs provide incomplete information about actual technical capability.
* Candidate claims can be difficult to validate from a CV alone.
* Technical candidates can appear suitable during CV screening but fail to demonstrate the expected ability later.

These are **research findings**, not hypotheses.

---

## Product hypotheses

The following still require validation through prototype testing:

### H1

Recruiters will prefer conversational Position Profile creation over manually configuring requirements.

### H2

Recruiters will trust AI candidate matching more when evidence is visible.

### H3

Candidate-specific verification will reveal meaningful discrepancies between CV Match and demonstrated ability.

### H4

Recruiters will find separate **CV Match** and **Verified Skill** scores more useful than one overall candidate score.

### H5

Recruiters will consider verification valuable enough to use before investing interview time.

### H6

Recruiters will prefer AI-assisted qualification while retaining control over requirements, assessments and final candidate decisions.

---

# Product Risks

## Risk 1 — AI CV screening is already crowded

Generic AI CV matching is not sufficient differentiation.

**Mitigation:**

Position the product around:

> **Candidate claim verification and evidence-based qualification.**

---

## Risk 2 — Recruiters don't trust AI scoring

Opaque scores could reduce adoption.

**Mitigation:**

* Evidence-first UI
* Requirement-level explanations
* Recruiter controls
* Editable requirements
* Editable assessments
* Clear distinction between evidence and inference

---

## Risk 3 — Verification adds friction

Recruiters may not want another step.

**Mitigation:**

The product should make verification selective.

Recruiters don't need to test everyone.

They can verify candidates who:

* Are strong CV matches
* Have uncertain evidence
* Have important claims requiring validation
* Have a large CV/skill discrepancy

---

## Risk 4 — AI assessment quality is inconsistent

Poorly generated questions undermine trust.

**Mitigation:**

* Position Profile grounding
* Candidate CV grounding
* Recruiter review
* Regenerate/edit controls
* Structured evaluation criteria

---

## Risk 5 — Product becomes another ATS

Expanding into every part of recruitment would dilute the core value.

**Mitigation:**

Maintain a clear product boundary:

> **Qualification before interview.**

---

# Future Roadmap

## Phase 1 — AI Qualification

**Define → Match → Verify**

* Position Profile
* AI requirements conversation
* CV matching
* Evidence
* Candidate-specific verification
* Verified Skill Score

---

## Phase 2 — Candidate Intelligence

* Candidate comparison
* Contradiction detection
* Adaptive assessments
* Evidence graph
* Historical recruiter decisions
* Company-specific qualification patterns

---

## Phase 3 — Connected Recruiting

* ATS integrations
* LinkedIn/approved sourcing integrations
* CV database integrations
* Assessment providers
* Email integrations

---

## Phase 4 — Agentic Qualification

A recruiter could eventually say:

> "Find me 10 candidates who match this Position Profile."

The system could:

1. Search connected sources.
2. Identify candidates.
3. Evaluate their CVs.
4. Explain the evidence.
5. Recommend candidates.
6. Prepare verification assessments.
7. Present the qualified shortlist.

The recruiter remains responsible for the final decision.

---

# Long-Term Product Moat

The potential moat is not the underlying AI model.

It is the structured relationship between:

**Requirements → Candidate Evidence → Recruiter Decisions → Verification Results → Hiring Outcomes**

Over time, the product could understand the difference between:

> **What a company says it wants**

and

> **What actually makes a candidate successful for that company.**

This is a long-term opportunity, not an MVP requirement.

---

# Product Positioning

### One sentence

> **An AI-native candidate qualification platform that helps technical recruiters define what good looks like, match candidates against evidence in their CVs, and verify the skills behind those claims.**

### Short pitch

> **Match the CV. Verify the skill. Know who is actually qualified.**

### Category

**AI Candidate Qualification**

### Product wedge

**CV → Evidence → Verification**

### Product boundary

**Between sourcing and interviewing.**

---

# The Core Product Experience

The entire product should ultimately communicate one simple idea:

```text id="q6k2ab"
                 WHAT THE CV SAYS
                        │
                        ▼
                ┌───────────────┐
                │  CV MATCH     │
                │     96%       │
                └───────┬───────┘
                        │
                        │
                 WHAT THEY CAN DO
                        │
                        ▼
                ┌───────────────┐
                │  VERIFIED     │
                │    58%        │
                └───────┬───────┘
                        │
                        ▼
              ┌───────────────────┐
              │   INVESTIGATE     │
              │                   │
              │ High CV alignment │
              │ but low           │
              │ demonstrated skill│
              └───────────────────┘
```

That discrepancy is the product's central value.

The product isn't trying to tell recruiters:

> **"This is the best candidate."**

It is trying to give them something much more useful:

> **"Here is what the candidate claims, here is the evidence supporting those claims, here is what they demonstrated, and here is where the two differ."**

That is the core thesis the MVP should prove.
