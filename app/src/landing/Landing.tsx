import "./landing.css";
import { Book } from "./Book";
import { currentChapter } from "./chapters";

function navigate(route: string) {
  window.location.hash = route;
}

export default function Landing() {
  const chapter = currentChapter();

  return (
    <div className="landing-shell">
      <Book chapter={chapter} onOpen={() => navigate(chapter.route)} />
    </div>
  );
}
