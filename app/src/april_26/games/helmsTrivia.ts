export type TriviaQuestion = {
  prompt: string;
  options: string[];
  answer: string;
};

export const HELMS_TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    prompt: "Who leads the defense at Helm's Deep alongside Aragorn?",
    options: ["Eomer", "Theoden", "Faramir", "Denethor"],
    answer: "Theoden",
  },
  {
    prompt: "What explosive weapon do the Uruk-hai use at Helm's Deep?",
    options: ["Dragon fire", "Black powder bomb", "Oil catapult", "Morgul flare"],
    answer: "Black powder bomb",
  },
  {
    prompt: "Who arrives at dawn to turn the battle?",
    options: ["Gandalf", "Elrond", "Boromir", "Treebeard"],
    answer: "Gandalf",
  },
  {
    prompt: "Which people defend Helm's Deep with Rohan?",
    options: ["Dwarves", "Elves", "Hobbits", "Corsairs"],
    answer: "Elves",
  },
  {
    prompt: "What kingdom does Helm's Deep belong to?",
    options: ["Gondor", "Mordor", "Rohan", "Dale"],
    answer: "Rohan",
  },
  {
    prompt: "Who says 'So it begins' at Helm's Deep?",
    options: ["Aragorn", "Theoden", "Legolas", "Gimli"],
    answer: "Theoden",
  },
  {
    prompt: "What is the fortress also called?",
    options: ["The Hornburg", "Minas Keep", "Barad Hall", "The White Wall"],
    answer: "The Hornburg",
  },
  {
    prompt: "Who keeps count with Legolas during the battle?",
    options: ["Aragorn", "Gimli", "Haldir", "Eowyn"],
    answer: "Gimli",
  },
];

export function pickHelmsTriviaQuestion(): TriviaQuestion {
  return HELMS_TRIVIA_QUESTIONS[Math.floor(Math.random() * HELMS_TRIVIA_QUESTIONS.length)];
}
