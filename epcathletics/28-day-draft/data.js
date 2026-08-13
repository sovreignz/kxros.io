(() => {
  const ex = (name, beginner, intermediate, advanced, video = "", note = "") => ({
    name, reps: { beginner, intermediate, advanced }, video, note
  });

  const warmup = [
    ex("Cat-Cow", "10 reps", "10 reps", "10 reps", "z5NCMppo1iw"),
    ex("Bird Dog", "10 / side", "10 / side", "10 / side", "oCbs2FzYzDw"),
    ex("Thread the Needle", "8–10 / side", "8–10 / side", "8–10 / side", "6oHjrsfEgv4"),
    ex("90/90 Hold", "6–8 / side · 30 sec", "6–8 / side · 30 sec", "6–8 / side · 30 sec", "sYjU04NJkIE")
  ];

  const lower = [
    ex("Banded Abductions", "2 × 15", "2 × 20", "2 × 20", "dikUH1AwXKo"),
    ex("Banded Squats", "2 × 10", "2 × 15", "2 × 15", "tjDilY3zjSM"),
    ex("Walking Lunges", "1 × 10 / leg", "2 × 10 / leg", "2 × 10 / leg", "h23ILWy0lOg"),
    ex("Hip Thrust", "1 × 10 warm-up + 2 × 10", "1 × 10 warm-up + 3 × 8–10", "1 × 10–12 + 3 × 8–10", "zKvNC_dTiTQ"),
    ex("Heels-Elevated Front Squat", "2 × 10", "3 × 10–12", "4 × 10–12", "NdvrdP9Resg"),
    ex("B-Stance RDL", "2 × 10", "3 × 10", "3 × 10–12", "6e3CjuuGAdQ"),
    ex("Reverse Lunges", "2 × 8 / side", "3 × 8–10 / side", "3 × 8–12 / side", "5SLg3y4CpNE"),
    ex("Standing Calf Raises", "2 × 12", "3 × 12–15", "4 × 12–15", "kF7rg8HowU4"),
    ex("Adductor Squeezes", "2 × 12–15", "3 × 12–15", "3 × 12–15", "2TMtGUiRGhE"),
    ex("Seated Abduction", "2 × 15", "3 × 15–20", "4 × 15–20", "ou7BNyBlOPo")
  ];

  const upper = [
    ex("Internal Rotation", "2 × 10 / side", "2 × 10 / side", "2 × 10 / side", "_5MBLGXqiH0"),
    ex("External Rotation", "2 × 10 / side", "2 × 10 / side", "2 × 10 / side", "H2QCCV-p2dk"),
    ex("Cable Pullover", "2 × 12", "2 × 12–15", "2 × 12–15", "Mx45mjG5wYI"),
    ex("Seated Shoulder Press", "1 × 10 + 2 × 10", "1 × 10 + 3 × 8–10", "1 × 10 + 3 × 8–10", "dtl38Coc85Y"),
    ex("Lat Pulldown", "1 × 10 + 2 × 10", "1 × 10 + 3 × 10", "1 × 12 + 3 × 10–12", "kzu5P1lFqvk"),
    ex("Dumbbell Chest Press", "1 × 10 + 2 × 10", "1 × 10 + 3 × 8–10", "1 × 10–12 + 3 × 8–10", "i6j4MJPlhEo"),
    ex("Face Pull", "2 × 12", "3 × 12", "3 × 12–15", "HR4j0ScFmoY"),
    ex("Single-Arm Leaning Lateral Raise", "2 × 10 / side", "3 × 10 / side", "3 × 10–12 / side", "wbrv3OWaxHE"),
    ex("Tricep Dips", "2 × 8", "3 × 8–10", "3 × 8–10", "Nz00i8u8ZXU"),
    ex("Alternating Bicep Curls", "2 × 10", "3 × 10", "3 × 10–12 / side", "HKMotjGEFeo")
  ];

  const fullBody = [
    ex("Scapular Push-Ups", "2 × 8", "2 × 10", "2 × 10", "KH601AwkmaQ"),
    ex("Walkout to High Plank", "2 × 6", "2 × 8", "2 × 8 · add push-up if ready", "V3otISSlfpM"),
    ex("Banded Lateral Walks", "2 × 8 / side", "2 × 10 / side", "2 × 10 / side", "3xL04T595fM"),
    ex("Banded Kickbacks", "2 × 10 / side", "2 × 12 / side", "2 × 12 / side", "99yJZ19HC6U"),
    ex("Romanian Deadlift", "1 × 10 + 2 × 10", "1 × 10 + 3 × 8–10", "1 × 10–12 + 3 × 8–10", "TrNZR7ljTDo"),
    ex("Bridged Bench Press", "2 × 10", "3 × 10–12", "4 × 10–12", "gVQA3EcT8SI"),
    ex("Squat to Press", "2 × 10", "3 × 10", "3 × 10–12", "bGQmOSdG3yQ"),
    ex("Bent Single-Arm Row", "2 × 10 / side", "3 × 8–10 / side", "3 × 8–10 / side", "bQXwCRfFm8c"),
    ex("Single-Leg Glute Bridge", "2 × 10 / side", "3 × 10 / side", "3 × 10–12 / side", "gZe_XgA--Mg"),
    ex("Overhead Tricep Extension", "2 × 10", "3 × 10–12", "4 × 10–12", "n_Oi09RXekI"),
    ex("Concentration Curl", "2 × 10", "3 × 10", "3 × 10–12", "uwP8rYyzSO0")
  ];

  const conditioning = [
    ex("Squat Jumps", "10 reps", "10 reps", "10 weighted reps", "C0twoJ5efgM"),
    ex("Plank Up-Down", "8 reps", "8 reps", "8 reps", "2I003WBtGxo"),
    ex("Front Lunge", "10 / side", "10 / side", "10 weighted / side", "_Em0luasbGE"),
    ex("Lateral Lunge", "10 / side", "10 / side", "10 weighted / side", "qlkYIV5PAjs"),
    ex("Prone Froggy", "15 reps", "15 reps", "15 banded reps", "ZEyQiP1U3dY"),
    ex("Inchworm Walkout", "8 reps", "8 reps", "8 reps", "z1kPWhpCgl0")
  ];

  const abs = [
    ex("Forearm Plank", "20 sec", "30 sec", "40 sec", "v5D5WeEP8To"),
    ex("Dead Bug", "20 sec", "30 sec", "40 sec weighted", "xLHf0Q7TuyM"),
    ex("Russian Twists", "20 sec", "30 sec", "40 sec weighted", "-DatiL7x-g4"),
    ex("Toe-Touch Crunches", "20 sec", "30 sec", "40 sec weighted", "EmSLNzlCHEc"),
    ex("Bent-Knee Reverse Crunch", "20 sec", "30 sec", "40 sec", "lXsc1Qf9_2g")
  ];

  const sessions = {
    lower: {
      title: "Lower Body",
      short: "Lower",
      type: "Strength",
      duration: "55–70 min",
      equipment: "Bands · weights · bench",
      image: "assets/emma-lower.jpg",
      sections: [
        { title: "Mobility warm-up", intro: "After 10–15 minutes of easy cardio.", exercises: warmup },
        { title: "Lower-body workout", exercises: lower }
      ],
      home: [
        "Use a sofa or sturdy bench for hip thrusts.",
        "Hold one dumbbell, a loaded backpack or band for squats, RDLs and lunges.",
        "Replace the abduction machine with seated band abductions."
      ]
    },
    conditioning: {
      title: "Conditioning + Abs",
      short: "Conditioning",
      type: "Conditioning",
      duration: "30–45 min",
      equipment: "Mat · optional weights",
      sections: [
        { title: "Conditioning AMRAP", intro: "Complete quality rounds for 5 min (Beginner), 10 min (Intermediate) or 20 min (Advanced). Rest as needed.", exercises: conditioning },
        { title: "Abs circuit", intro: "Complete 2 rounds (Beginner), 3 rounds (Intermediate) or 4 rounds (Advanced). Rest 20 / 15 / 15 seconds between movements.", exercises: abs }
      ],
      home: [
        "This entire session can be completed at home in a small space.",
        "Keep it bodyweight or add dumbbells and a loop band when the Advanced prescription calls for load."
      ]
    },
    upper: {
      title: "Upper Body + Cardio",
      short: "Upper + Cardio",
      type: "Strength + Cardio",
      duration: "75–90 min",
      equipment: "Bands · dumbbells · cable",
      sections: [
        { title: "Mobility warm-up", intro: "After 10–15 minutes of easy cardio.", exercises: warmup },
        { title: "Upper-body workout", exercises: upper },
        { title: "Cardio finish", intro: "30 minutes at low-to-moderate intensity. Aim to keep your heart rate around 120–140 BPM.", exercises: [] }
      ],
      home: [
        "Use a long anchored band for pullovers, pulldowns and face pulls.",
        "Use dumbbells for pressing, lateral raises and curls.",
        "Use a sturdy chair for tricep dips; walk, cycle or use stairs for cardio."
      ]
    },
    full: {
      title: "Full Body",
      short: "Full Body",
      type: "Strength",
      duration: "60–75 min",
      equipment: "Bands · dumbbells · bench",
      sections: [
        { title: "Mobility warm-up", intro: "After 10–15 minutes of easy cardio.", exercises: warmup },
        { title: "Full-body workout", exercises: fullBody }
      ],
      home: [
        "Use dumbbells, resistance bands or a loaded backpack for your main lifts.",
        "Use the floor for bridged presses and a sturdy chair or sofa for support."
      ]
    },
    cardio: {
      title: "Cardio",
      short: "Cardio",
      type: "Active",
      duration: "30 min",
      equipment: "Your choice",
      sections: [
        {
          title: "Low-to-moderate cardio",
          intro: "Choose walking, incline treadmill, cycling, elliptical or another steady option. Aim for 120–140 BPM and a pace you can sustain with control.",
          exercises: [ex("Steady Cardio", "30 minutes", "30 minutes", "30 minutes")]
        }
      ],
      home: [
        "Walk outdoors, use stairs, march with intention or follow a low-impact cardio session.",
        "Keep the intensity sustainable; this is not an all-out interval day."
      ]
    }
  };

  const pattern = ["lower", "conditioning", "upper", "full", "conditioning", "cardio", "cardio"];
  const weeks = ["Build the foundation", "Own the movement", "Build your strength", "Finish strong"];
  const days = Array.from({ length: 28 }, (_, index) => ({
    day: index + 1,
    week: Math.floor(index / 7) + 1,
    weekName: weeks[Math.floor(index / 7)],
    session: pattern[index % 7]
  }));

  window.EPC_PROGRAM = {
    storageKey: "epc-28-day-strong-v1",
    levels: ["beginner", "intermediate", "advanced"],
    days,
    sessions
  };
})();
