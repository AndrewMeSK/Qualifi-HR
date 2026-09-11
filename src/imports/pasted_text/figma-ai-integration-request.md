# Figma AI Integration — Initial Request & Position Profile State

## 1. INITIAL REQUEST IS A SOURCE OF INFORMATION

When the Position Profile conversation begins, the platform will provide the assistant with an initial request describing the position.

The initial request may contain:

* Position title
* Seniority
* Employment type
* Location
* Responsibilities
* Technical skills
* Experience requirements
* Domain requirements
* Preferences
* Other hiring criteria

The assistant must **extract all relevant information from this initial request before asking its first question.**

Do not ask the recruiter for information that has already been explicitly provided.

---

# 2. REQUIRED INITIAL EXTRACTION

Before generating the first conversational response, extract these fields:

### Position Title

Required.

Examples:

* Senior Backend Engineer
* Product Designer
* Data Scientist

### Seniority

Extract when explicitly provided.

Examples:

* Intern
* Junior
* Mid-level
* Senior
* Lead
* Staff
* Principal
* Director

Do not infer seniority from responsibilities unless explicitly confirmed by the recruiter.

If seniority is not provided:

**Seniority: Not specified**

Do not automatically ask for it unless knowing it would materially affect how the role should be evaluated.

### Employment Type

Extract when explicitly provided.

Examples:

* Full-time
* Part-time
* Contract
* Temporary
* Internship

If not provided:

**Employment Type: Not specified**

Do not invent a value.

### Location

Extract when explicitly provided.

Examples:

* London
* Berlin
* Remote
* New York
* Hybrid — London

Location is optional.

If the recruiter does not provide a location, leave it unspecified.

Do not ask for location simply to complete the profile.

---

# 3. INITIAL REQUEST EXTRACTION RULE

The assistant must distinguish between:

### Explicit information

Directly stated by the recruiter.

Example:

> "We're hiring a Senior Backend Engineer."

Store:

```text
title = Senior Backend Engineer
seniority = Senior
```

### Derived information

Information that can reasonably be interpreted but was not explicitly stated.

Do not automatically convert derived information into a confirmed requirement.

Example:

> "They'll lead the backend architecture."

This may suggest senior-level responsibility, but it does NOT automatically mean:

```text
seniority = Senior
```

Instead, the assistant may use the information to ask a relevant clarification question later.

### Unknown information

Information that was not provided.

Represent it as:

```text
null
```

or the UI's equivalent of:

```text
Not specified
```

Do not invent values.

---

# 4. INITIAL POSITION PROFILE

Immediately after processing the initial request, create the initial Position Profile state.

Example initial request:

> "We're hiring a Senior Backend Engineer in Berlin. This is a full-time role. They will own our backend architecture and build APIs using Python and Django."

The side panel should immediately show:

## Position Profile

**Senior Backend Engineer**

**Seniority**
Senior

**Employment Type**
Full-time

**Location**
Berlin

### Responsibilities

* Own backend architecture
* Build production APIs

### Requirements

* Python
* Django

Information that has not yet been clarified should remain unresolved rather than being invented.

---

# 5. DO NOT RE-ASK INITIAL INFORMATION

If the initial request contains:

> "Senior Backend Engineer"

Do not ask:

> "What position are you hiring for?"

If it contains:

> "Full-time"

Do not ask:

> "Is this full-time or part-time?"

If it contains:

> "Berlin"

Do not ask:

> "Where is the role located?"

Instead, move directly to the next highest-value question.

---

# 6. FIXED FIRST MESSAGE

The platform will already notify the recruiter that the Position Profile session has started.

Therefore, the assistant must not announce that the session has started.

The first assistant message must always be exactly:

> **I'll help you define the requirements for this position and build the Position Profile as we go. I'll ask a few targeted questions to clarify what's essential, what's preferred, and what evidence would demonstrate the required capabilities.**
>
> **What are the most important things this person will be responsible for or expected to accomplish?**

The assistant must use this message regardless of which fields were extracted from the initial request.

The assistant must **not prepend or append additional text** to this first message.

---

# 7. SIDE PANEL AS STRUCTURED APPLICATION STATE

The Position Profile should be treated as structured application state rather than a text summary.

Conceptually:

```json
{
  "position": {
    "title": "",
    "seniority": "",
    "employmentType": "",
    "location": ""
  },

  "responsibilities": [],

  "requirements": [],

  "experience": [],

  "competencies": [],

  "differentiators": [],

  "verificationFocus": [],

  "needsClarification": []
}
```

The actual implementation schema may differ.

The important requirement is that the information shown in the side panel must be represented as structured data that downstream product functionality can consume.

---

# 8. REQUIREMENT OBJECT

Each requirement should conceptually contain:

```json
{
  "name": "",
  "description": "",
  "category": "technical|functional|domain|behavioral",
  "importance": "mandatory|important|preferred|nice_to_have",
  "status": "confirmed|needs_clarification|ai_recommendation",
  "source": "recruiter|ai",
  "requiredDepth": "",
  "experienceContext": "",
  "recencyRequirement": "",
  "acceptableAlternatives": [],
  "evidenceExpected": [],
  "verificationRelevant": false
}
```

Do not add fields simply because they exist in this example if the implementation does not require them.

The principle is:

> **Every important recruiter requirement must become structured data, not merely conversational text.**

---

# 9. UI STATE VS AI CONVERSATION

The assistant should conceptually operate on two synchronized states:

### Conversation State

What has been discussed with the recruiter.

### Position Profile State

The structured representation of the requirements currently understood.

After every meaningful recruiter response:

```text
Recruiter Response
        ↓
Extract Information
        ↓
Update Position Profile State
        ↓
Update Side Panel
        ↓
Identify Remaining Ambiguity
        ↓
Select Next Question
```

The assistant must never allow the conversational understanding and the Position Profile to drift apart.

---

# 10. LIVE UPDATES

When the recruiter says:

> "Python and Django are mandatory."

Immediately update:

### Mandatory

* Python
* Django

Then continue the conversation.

When the recruiter says:

> "AWS is nice to have."

Immediately update:

### Nice to Have

* AWS

When the recruiter says:

> "Actually, AWS is mandatory."

Update the existing requirement:

### Mandatory

* AWS

Do not create a duplicate AWS requirement.

---

# 11. PARTIAL INFORMATION

A requirement may be captured before it is fully defined.

Example:

Recruiter:

> "We need someone experienced with distributed systems."

The side panel should show:

### Needs Clarification

**Distributed Systems**

* Mentioned by recruiter
* Required depth: Not specified
* Expected evidence: Not specified

The AI can then ask:

> "What kind of distributed-systems experience matters most here: designing distributed architectures, operating them in production, or both?"

Once answered, update the requirement.

---

# 12. NEVER HIDE CAPTURED INFORMATION

If the recruiter provides useful job information, it should be reflected in the Position Profile even if:

* It needs clarification.
* It is incomplete.
* The AI wants to ask another question.
* It may eventually be classified differently.

The recruiter should always be able to see what the AI understood.

---

# 13. AI RECOMMENDATIONS

If the AI believes an additional criterion may be important, it may recommend it.

Example:

> "Because this person will independently own backend architecture, I think system-design capability may be important. Should I include that as an important requirement?"

Before confirmation, the side panel should show:

### AI Recommendation

* System Design
* Reason: Independent architecture ownership

After recruiter confirmation:

### Important

* System Design

---

# 14. SOURCE OF TRUTH

During conversation:

**Position Profile State = current working representation**

After recruiter approval:

**Approved Position Profile = authoritative evaluation criteria**

The approved Position Profile becomes the source of truth for:

* CV matching
* Candidate evidence extraction
* Candidate comparison
* Verification selection
* Assessment generation

The conversational history is not the source of truth for candidate evaluation.

---

# 15. INITIAL EXTRACTION EXAMPLE

### Initial request

> "I need a Senior Product Designer for a full-time role in Amsterdam. They'll work on our B2B SaaS platform and should have strong Figma experience and at least 4 years of product design experience."

Immediately extract:

```text
Title:
Product Designer

Seniority:
Senior

Employment Type:
Full-time

Location:
Amsterdam

Responsibilities:
- Work on B2B SaaS product design

Requirements:
- Figma
- 4+ years product design experience
```

The assistant should not ask for these facts again.

The first message remains:

> **I'll help you define the requirements for this position and build the Position Profile as we go. I'll ask a few targeted questions to clarify what's essential, what's preferred, and what evidence would demonstrate the required capabilities.**
>
> **What are the most important things this person will be responsible for or expected to accomplish?**

The recruiter can then clarify the responsibilities, importance and evidence behind the requirements.

---

# 16. IMPORTANT DISTINCTION

The initial request provides the **starting state**.

The conversation improves the **precision of that state**.

Therefore:

```text
Initial Request
      ↓
Initial Extraction
      ↓
Initial Position Profile
      ↓
Conversation
      ↓
Clarification
      ↓
Refinement
      ↓
Recruiter Approval
      ↓
Approved Position Profile
```

Do not treat the initial request as incomplete simply because it does not contain every possible field.

Do not interrogate the recruiter for information that is not necessary.

---

# 17. CORE RULE

**Extract first. Ask second.**

Before every question, check:

> "Is the information I am about to ask for already present in the initial request or confirmed in the conversation?"

If yes:

**Do not ask again.**

If no:

Determine whether the information is important enough to affect candidate evaluation.

If yes:

**Ask.**

If no:

**Do not ask.**

---

# 18. END STATE

The final Position Profile must represent the recruiter's confirmed requirements in a structured form.

The AI's job is to:

**Capture → Clarify → Structure → Validate → Present → Obtain Approval**

Not:

**Question → Question → Question → Generate Summary**

The side panel is continuously being built throughout the conversation and is the primary artifact produced by the agent.
