const lessonLinks = document.querySelectorAll(".lesson-link");
const lessonTag = document.getElementById("lessonTag");
const lessonTitle = document.getElementById("lessonTitle");
const lessonContent = document.getElementById("lessonContent");
const lessonStatus = document.getElementById("lessonStatus");

const courseProgressText = document.getElementById("courseProgressText");
const courseProgressFill = document.getElementById("courseProgressFill");

const prevLessonBtn = document.getElementById("prevLessonBtn");
const completeLessonBtn = document.getElementById("completeLessonBtn");
const nextLessonBtn = document.getElementById("nextLessonBtn");

let currentLessonIndex = 0;

const lessons = [
  {
    id: 0,
    title: "Was dich erwartet",
    tag: "Lektion 0",
    content: `
      <ul>
        <li>
          Fliegen, Lernen oder deinen Crush küssen – all das ist mit luzidem Träumen möglich.
        </li>
        <li>
          Durch uns wirst du lernen, dich kristallklar an deine Träume zu erinnern,
          Techniken zu nutzen, um zu erkennen, dass du träumst, verschiedene Methoden
          im Traum zur Stabilisation anzuwenden und noch vieles mehr. So können dir
          keine Grenzen mehr gesetzt werden.
        </li>
        <li>
          Aber es braucht auch Zeit. Deswegen freuen wir uns sehr, dass du so motiviert
          dabei bist, denn es lohnt sich wirklich für jeden, diesen Skill zu lernen.
        </li>
      </ul>

      <div class="lesson-box">
        <h3>Wichtig</h3>
        <p>
          Luzides Träumen ist ein Skill. Je regelmäßiger du übst, desto besser wirst du.
        </p>
      </div>
    `
  },
  {
    id: 1,
    title: "Warum Traumerinnerung die Basis ist",
    tag: "Lektion 1",
    content: `
      <p>
        Wenn du dich nicht an deine Träume erinnerst, merkst du auch nicht,
        ob du luzid warst. Deshalb kommt Traumerinnerung vor allen Techniken.
        Der schönste Klartraum bringt dir nichts, wenn du dich am Ende nicht einmal
        mehr daran erinnerst.
      </p>

      <p>
        Grundlegend kann man sagen, dass es auch bei der Traumerinnerung darum geht,
        es für dein Gehirn wichtig zu machen. Je wichtiger und präsenter Träume in deinem
        Leben sind, desto leichter fällt es dir dich daran zu erinnern.  
      </p>

      <div class="lesson-box">
        <h3>Abendliche Intention</h3>
        <p>
          Mache Träume in deinem Leben wichtig. Je wichtiger du sie machst, desto klarer wirst du dich erinnern.
        </p>
      </div>

    `
  },
  {
    id: 2,
    title: "Traumerinnerung verbessern",
    tag: "Lektion 1",
    content: `
      <p>
        Wie wir in der vorherigen Lektion bereits besprochen haben, geht es in diesem
        Segement um die Wichtigkeit.
      </p>

      <div class="lesson-box">      
      <h3>
        Es gibt viele Möglichkeiten, Träume wichtiger zu machen, zum Beispiel:
      </h3>
      

      <ol>
        <li>Traumtagebuch führen, was das genau ist erfährst du später in diesem Kurs.</li>
        <li>Mit Freunden und Familie über seine Träume sprechen, oder sie nach ihren eigenen fragen.</li>
        <li></li>
        <li></li>
      </ol>
      </div>

    

    `
  },
  {
    id: 3,
    title: "Morgenroutine",
    tag: "Lektion 1",
    content: `
      <p>
        Dein Traumtagebuch ist eines der wichtigsten Werkzeuge, wenn du luzides Träumen lernen willst.
        Es geht nicht nur darum, Träume aufzuschreiben, sondern deinem Gehirn zu zeigen:
        „Meine Träume sind wichtig.“
      </p>

      <p>
        Je öfter du deine Träume dokumentierst, desto leichter erkennst du wiederkehrende Orte,
        Personen, Gefühle und Situationen. Genau diese Muster helfen dir später dabei,
        im Traum bewusst zu werden.
      </p>

      <p>
        Ein guter Eintrag muss nicht perfekt sein. Wichtig ist, dass du ihn direkt nach dem
        Aufwachen machst und ehrlich aufschreibst, woran du dich erinnerst.
      </p>

      <ol>
        <li>Gib deinem Traum einen kurzen Titel.</li>
        <li>Schreibe auf, was passiert ist.</li>
        <li>Notiere Personen, Orte und Gefühle.</li>
        <li>Markiere mögliche Traumzeichen.</li>
        <li>Schreibe dazu, ob etwas unlogisch war.</li>
      </ol>

      <div class="lesson-box">
        <h3>Merksatz</h3>
        <p>
          Dein Traumtagebuch ist nicht nur Erinnerung, sondern Training für dein Bewusstsein.
        </p>
      </div>
    `
  },
  {
    id: 4,
    title: "Abendroutine",
    tag: "Lektion 1",
    content: `
      <p>
        Traumzeichen sind Dinge, die in deinen Träumen immer wieder vorkommen.
        Das können Orte, Personen, Situationen, Gefühle oder seltsame Ereignisse sein.
      </p>

      <p>
        Wenn du deine Traumzeichen kennst, hast du einen riesigen Vorteil. Denn sobald so ein
        Zeichen im Traum wieder auftaucht, kann es dich daran erinnern:
        „Moment, das kenne ich doch aus meinen Träumen.“
      </p>

      <p>
        Typische Traumzeichen können sein:
      </p>

      <ul>
        <li>Schule, obwohl du dort gar nicht mehr bist</li>
        <li>alte Freunde oder bekannte Personen</li>
        <li>Fliegen oder Fallen</li>
        <li>Verfolgung</li>
        <li>Prüfungen oder Stresssituationen</li>
        <li>Technik funktioniert nicht richtig</li>
        <li>Orte verändern sich plötzlich</li>
      </ul>

      <p>
        Deshalb ist es so wichtig, beim Eintragen deiner Träume Tags oder Traumzeichen auszuwählen.
        Mit der Zeit erkennst du deine persönlichen Muster.
      </p>

      <div class="lesson-box">
        <h3>Übung</h3>
        <p>
          Schau dir deine letzten Träume an und frage dich:
          Welche Personen, Orte oder Situationen kamen mehrfach vor?
        </p>
      </div>
    `
  },
  {
    id: 5,
    title: "Traumtagebuch erklärung",
    tag: "Lektion 2",
    content: `
      <p>
        Reality Checks sind kurze Überprüfungen, ob du gerade wach bist oder träumst.
        Das Ziel ist nicht, einfach irgendeine Bewegung auszuführen, sondern deine Realität
        wirklich bewusst zu hinterfragen.
      </p>

      <p>
        Der wichtigste Punkt ist: Ein Reality Check darf nicht mechanisch sein.
        Wenn du nur schnell klickst oder automatisch denkst „ja, ich bin wach“, bringt es wenig.
        Du musst für ein paar Sekunden ehrlich zweifeln.
      </p>

      <p>
        Gute Fragen sind:
      </p>

      <ul>
        <li>Wie bin ich hierher gekommen?</li>
        <li>Was habe ich vor 10 Minuten gemacht?</li>
        <li>Ist irgendetwas an meiner Umgebung unlogisch?</li>
        <li>Könnte das gerade ein Traum sein?</li>
      </ul>

      <p>
        Ein besonders guter Reality Check ist der Nasen-Test:
        Halte dir die Nase zu und versuche trotzdem zu atmen. Im Traum funktioniert das oft,
        obwohl es in der echten Welt nicht funktionieren sollte.
      </p>

      <div class="lesson-box">
        <h3>Merksatz</h3>
        <p>
          Ein Reality Check funktioniert nur, wenn du ihn bewusst machst.
          Nicht klicken. Wirklich zweifeln.
        </p>
      </div>
    `
  },
  {
    id: 5,
    title: "Traumtagebuch erklärung",
    tag: "Lektion 2",
    content: `
    <p>
      Das Traumtagebuch bietet dir ein Archiv deiner ganzer erinnerten Träume.
      Es hilft dir Träume für dein Gehirn wichtiger zu machen und 
      sich besser daran zu erinnern.
    </p>

    <p>
      Durch da niederschreiben deiner Träume wird es dir außerdem leichter Fallen,
      gewisse Muster zu erkennen, die dir später dabei helfen, im Traum luzide zu werden.
    </p>
     <div class="lesson-box">
        <h3>Merksatz</h3>
        <p>
          Dein Traumtagebuch ist nicht nur Erinnerung, sondern Training für dein Bewusstsein.
        </p>
      </div>
      `
  }
];

function getCompletedLessons() {
  return JSON.parse(localStorage.getItem("completedLessons")) || [];
}

function saveCompletedLessons(completedLessons) {
  localStorage.setItem("completedLessons", JSON.stringify(completedLessons));
}

function isLessonCompleted(lessonId) {
  return getCompletedLessons().includes(lessonId);
}

function updateProgress() {
  const completedLessons = getCompletedLessons();

  const validCompletedLessons = completedLessons.filter((lessonId) => {
    return lessons.some((lesson) => lesson.id === lessonId);
  });

  const doneCount = validCompletedLessons.length;
  const totalCount = lessons.length;
  const percentage = (doneCount / totalCount) * 100;

  courseProgressText.textContent = `${doneCount} / ${totalCount} erledigt`;
  courseProgressFill.style.width = `${percentage}%`;

  lessonLinks.forEach((link) => {
    const lessonId = Number(link.dataset.lesson);

    if (validCompletedLessons.includes(lessonId)) {
      link.classList.add("done");
    } else {
      link.classList.remove("done");
    }
  });
}

function renderLesson(index) {
  currentLessonIndex = index;

  const lesson = lessons[index];

  lessonTag.textContent = lesson.tag;
  lessonTitle.textContent = lesson.title;
  lessonContent.innerHTML = lesson.content;

  lessonLinks.forEach((link) => {
    link.classList.remove("active");

    if (Number(link.dataset.lesson) === lesson.id) {
      link.classList.add("active");
    }
  });

  if (isLessonCompleted(lesson.id)) {
    lessonStatus.textContent = "Erledigt";
    lessonStatus.classList.add("done");
    completeLessonBtn.textContent = "Erledigt";
    completeLessonBtn.classList.add("done");
  } else {
    lessonStatus.textContent = "Nicht erledigt";
    lessonStatus.classList.remove("done");
    completeLessonBtn.textContent = "Als erledigt markieren";
    completeLessonBtn.classList.remove("done");
  }

  prevLessonBtn.disabled = index === 0;
  nextLessonBtn.disabled = index === lessons.length - 1;
}

lessonLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const lessonIndex = Number(link.dataset.lesson);
    renderLesson(lessonIndex);
  });
});

completeLessonBtn.addEventListener("click", () => {
  const lesson = lessons[currentLessonIndex];
  const completedLessons = getCompletedLessons();

  if (!completedLessons.includes(lesson.id)) {
    completedLessons.push(lesson.id);
    saveCompletedLessons(completedLessons);
  }

  updateProgress();
  renderLesson(currentLessonIndex);
});

prevLessonBtn.addEventListener("click", () => {
  if (currentLessonIndex > 0) {
    renderLesson(currentLessonIndex - 1);
  }
});

nextLessonBtn.addEventListener("click", () => {
  if (currentLessonIndex < lessons.length - 1) {
    renderLesson(currentLessonIndex + 1);
  }
});

updateProgress();
renderLesson(0);