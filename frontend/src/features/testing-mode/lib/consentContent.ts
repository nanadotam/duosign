export type ConsentAudience = "hearing" | "deaf_hoh" | "combined";

export interface ConsentSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface ConsentDocument {
  audience: ConsentAudience;
  label: string;
  participantLabel: string;
  sections: ConsentSection[];
}

export const CONSENT_DOCUMENTS: Record<ConsentAudience, ConsentDocument> = {
  deaf_hoh: {
    audience: "deaf_hoh",
    label: "Deaf / Hard-of-Hearing",
    participantLabel: "For Deaf and Hard-of-Hearing Participants",
    sections: [
      {
        title: "Study Invitation",
        paragraphs: [
          "You are invited to participate in a research study about sign language translation technology. This document explains the study so you can decide whether you want to take part.",
          "Please read carefully, take your time, and ask questions at any point before, during, or after the session.",
        ],
      },
      {
        title: "Purpose of the Study",
        paragraphs: [
          "The study evaluates DuoSign, a two-way sign language translation framework that translates text into sign language with an animated 3D avatar.",
          "The goal is to understand whether the system is accurate, natural, comfortable to use, and useful for communication between deaf and hearing communities.",
        ],
        bullets: [
          "Does the system correctly recognize signs?",
          "Does the avatar signing look natural and clear?",
          "Is the system easy and comfortable to use?",
          "Does it help communication between deaf and hearing people?",
        ],
      },
      {
        title: "What You Will Be Asked to Do",
        paragraphs: [
          "Participation typically involves one session lasting about 30 to 60 minutes.",
        ],
        bullets: [
          "Introduction and study explanation",
          "Short system demonstration",
          "Testing activities with typed messages and avatar signing",
          "Free practice with signs or conversations",
          "Questionnaire about your experience",
          "Optional interview in sign language or writing",
        ],
      },
      {
        title: "Voluntary Participation",
        bullets: [
          "Participation is completely voluntary.",
          "You may stop at any time without giving a reason.",
          "You may skip any question or activity.",
          "You may take breaks whenever needed.",
          "You may ask for your data to be deleted after the session.",
        ],
      },
      {
        title: "Risks and Discomforts",
        paragraphs: [
          "The study is considered minimal risk, but you may experience normal prototype-related discomforts.",
        ],
        bullets: [
          "Fatigue from signing for 30 to 60 minutes",
          "Frustration if the system makes mistakes",
          "Privacy concerns around optional recording",
          "Emotional discomfort when discussing communication barriers",
        ],
      },
      {
        title: "Benefits",
        bullets: [
          "You can experience new sign language technology before public release.",
          "You can influence how accessibility technology is designed.",
          "You contribute to research that may benefit the deaf community in Ghana and beyond.",
          "You may request a summary of the study findings.",
        ],
      },
      {
        title: "Confidentiality and Privacy",
        bullets: [
          "Your name will not be used in reports, publications, or presentations.",
          "You will be assigned a participant code instead of being identified by name.",
          "Video recordings are optional and stored on password-protected, encrypted devices.",
          "Only the student researcher and faculty supervisor can access identifying recordings.",
          "Consent forms are stored separately from study data.",
          "Identifying information will be destroyed after the project ends, targeted for August 2026.",
        ],
      },
      {
        title: "Questions or Concerns",
        paragraphs: [
          "Student Researcher: Nana Kwaku Amoako",
          "Email: nana.amoako@ashesi.edu.gh | Phone: +233247153173",
          "Faculty Supervisor: Kwabena Bamfo | Email: kwabena.bamfo@ashesi.edu.gh",
          "Ashesi University IRB: irb@ashesi.edu.gh",
        ],
      },
    ],
  },
  hearing: {
    audience: "hearing",
    label: "Hearing",
    participantLabel: "For Hearing Participants",
    sections: [
      {
        title: "Study Invitation",
        paragraphs: [
          "You are invited to take part in a research study about sign language translation technology. This document outlines the study so you can make an informed choice.",
        ],
      },
      {
        title: "Purpose of the Study",
        paragraphs: [
          "The study explores how hearing participants experience DuoSign and how the interface supports text-to-sign translation using an animated avatar.",
          "Your feedback helps improve accessibility and communication between hearing and deaf communities.",
        ],
      },
      {
        title: "What You Will Be Asked to Do",
        paragraphs: [
          "Participation usually involves one session lasting about 20 to 40 minutes.",
        ],
        bullets: [
          "Introduction and walkthrough of the system",
          "Demonstration of avatar generation and translation flow",
          "Typing 5 to 8 messages into the system",
          "Evaluating clarity and ease of use",
          "Completing a questionnaire",
          "Taking part in a short interview",
        ],
      },
      {
        title: "Voluntary Participation",
        bullets: [
          "Participation is voluntary.",
          "You may stop at any time without penalty.",
          "You may skip questions or activities.",
          "You may request deletion of your data after the session.",
        ],
      },
      {
        title: "Risks and Discomforts",
        bullets: [
          "Mild fatigue from computer use",
          "Minor frustration if the interface is confusing or unstable",
          "Privacy concerns around recorded interaction data",
        ],
      },
      {
        title: "Benefits",
        bullets: [
          "You gain exposure to accessibility technology in development.",
          "You contribute to research intended to improve communication tools.",
          "You may request a summary of study results.",
        ],
      },
      {
        title: "Confidentiality and Privacy",
        bullets: [
          "Your name will never appear in reports or publications.",
          "You will be assigned a participant code.",
          "Data will be stored on password-protected, encrypted devices.",
          "Consent forms are stored separately from test data.",
          "Identifying information will be destroyed after the project ends, targeted for August 2026.",
        ],
      },
      {
        title: "Questions or Concerns",
        paragraphs: [
          "Student Researcher: Nana Kwaku Amoako",
          "Email: nana.amoako@ashesi.edu.gh | Phone: +233247153173",
          "Faculty Supervisor: Kwabena Bamfo | Email: kwabena.bamfo@ashesi.edu.gh",
          "Ashesi University IRB: irb@ashesi.edu.gh",
        ],
      },
    ],
  },
  combined: {
    audience: "combined",
    label: "Combined Reference",
    participantLabel: "Combined view of hearing and deaf participant consent guidance",
    sections: [
      {
        title: "Overview",
        paragraphs: [
          "This view combines the hearing and deaf / hard-of-hearing consent pathways into one reference page for review.",
          "Use the audience tabs to switch to the participant-specific version that best matches the study session.",
        ],
      },
      {
        title: "Shared Principles",
        bullets: [
          "Participation is voluntary.",
          "Participants may withdraw at any time.",
          "Identifying information is kept separate from study data.",
          "Results are reported anonymously.",
          "Questions can be directed to the researcher, supervisor, or Ashesi University IRB.",
        ],
      },
    ],
  },
};
