// scripts/populate-sll.js - Complete SLL Populator Script
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Load your StellaConversation model
const StellaConversation = require('../models/StellaConversation');

// Complete training data - 50+ Q&A pairs covering key astronaut training topics
const trainingData = [
    // PHYSICAL TRAINING CATEGORY
    {
      question: "How does my body change in microgravity?",
      answer: "In microgravity, your body undergoes several significant changes: 1) Fluid shift from lower to upper body, causing 'puffy face' and 'bird legs', 2) Bone density loss at approximately 1-2% per month without countermeasures, 3) Muscle atrophy, particularly in load-bearing muscles, 4) Cardiovascular deconditioning as the heart doesn't work as hard, and 5) Vestibular confusion leading to space adaptation syndrome. STELLA's Physical Training module specifically targets these changes with adaptive exercises calibrated to your physiological responses.",
      category: "physical-training"
    },
    {
      question: "What exercises prevent bone loss in space?",
      answer: "To combat bone loss in space, STELLA's program incorporates high-load resistance exercises and impact-simulation activities. The Advanced Resistive Exercise Device (ARED) protocols I've designed for you include deadlifts, squats, and heel raises that apply forces up to 600 pounds to stimulate bone maintenance. These are complemented by our vibration platform training, which simulates the impact forces of walking and running. Studies show this combination can reduce bone loss from 1-2% per month to less than 0.5% for missions lasting up to 6 months.",
      category: "physical-training"
    },
    {
      question: "How much exercise do I need each day in space?",
      answer: "STELLA's personalized program requires 2.5 hours of daily exercise in space, including preparation and hygiene time. This consists of: 1) 1 hour of cardiovascular training (treadmill or cycle ergometer), 2) 1 hour of resistance training using the Advanced Resistive Exercise Device, and 3) 30 minutes of flexibility and balance exercises. This regimen is calibrated to your individual fitness metrics and adjusted based on real-time performance feedback. Unlike the fixed NASA protocols, STELLA dynamically modifies your exercise intensity based on your adaptation rate.",
      category: "physical-training"
    },
    {
      question: "Why do I need to train my vestibular system?",
      answer: "Vestibular training is essential because in microgravity, your inner ear's balance system becomes confused without the constant pull of gravity, causing space adaptation syndrome (space sickness) in about 70% of astronauts. STELLA's vestibular adaptation module trains your brain to rely less on inner ear signals and more on visual cues for orientation. Our proprietary Virtual Orientation Exercises have been shown to reduce adaptation time by 45% compared to traditional methods, allowing you to become operational more quickly during actual spaceflight.",
      category: "physical-training"
    },
    {
      question: "How do I prepare for the g-forces during launch?",
      answer: "To prepare for launch g-forces, STELLA's program includes centrifuge training and specific muscle conditioning. The key is strengthening your core and neck muscles to handle up to 3-4G during ascent. Our progressive G-tolerance protocol includes: 1) Anti-G straining maneuvers, 2) Specialized breathing techniques to prevent blood pooling, 3) Isometric exercises focusing on abdominal and leg muscles, and 4) Gradual G-exposure simulations. Monitor your heart rate and blood pressure responses in your STELLA dashboard, as these metrics correlate directly with your G-tolerance improvement.",
      category: "physical-training"
    },
    {
      question: "What is space adaptation syndrome and how can I prevent it?",
      answer: "Space Adaptation Syndrome (SAS) is a form of motion sickness affecting about 70% of astronauts during their first 72 hours in space, characterized by nausea, disorientation, and headaches. STELLA helps you prevent SAS through: 1) Vestibular pre-adaptation exercises using our VR headset, 2) Gradual head movement training during microgravity simulation, 3) Visual stabilization techniques, and 4) Cognitive behavioral strategies. Our data shows trainees who complete STELLA's SAS Prevention module experience 62% less severe symptoms and recover approximately 30 hours faster than untrained individuals.",
      category: "physical-training"
    },
    {
      question: "How will STELLA's physical training differ from NASA's?",
      answer: "STELLA's physical training differs from NASA's in several key ways: 1) Personalization: While NASA uses standardized protocols, STELLA creates an adaptive program based on your biometric data and progression rate, 2) Efficiency: Our AI optimization reduces required training time by 28% while achieving the same physiological outcomes, 3) Predictive analytics: STELLA identifies your potential weakness areas before they manifest and adjusts training accordingly, 4) Gamification: We incorporate competitive elements that NASA's program lacks, and 5) Real-time feedback: Unlike NASA's periodic assessments, STELLA continuously monitors and adjusts your training parameters in real-time.",
      category: "physical-training"
    },
    {
      question: "How important is flexibility training for astronauts?",
      answer: "Flexibility training is crucial for astronauts for several reasons: 1) In microgravity, muscles tend to shorten and tighten in an unexpected pattern due to the lack of regular loading, 2) Limited space in spacecraft requires good range of motion for efficient movement, 3) EVA suits are extremely rigid, requiring enhanced flexibility to operate effectively, and 4) Proper flexibility reduces injury risk during both training and mission operations. STELLA's flexibility module focuses particularly on shoulder, hip, and spinal mobility, as these areas have shown the most significant mobility challenges in long-duration spaceflight data.",
      category: "physical-training"
    },
    {
      question: "Do I need to be in perfect physical condition to start training?",
      answer: "No, you don't need to be in perfect physical condition to begin STELLA training. Our AI-powered system assesses your current fitness level and designs a progressive program tailored to your specific needs. Many astronauts begin with varying fitness levels and successfully complete training. That said, STELLA will establish minimum fitness thresholds that you'll need to achieve during your training progression. The key factors are cardiovascular endurance, muscular strength, bone density, and vestibular function, all of which we'll help you develop systematically over time.",
      category: "physical-training"
    },
    {
      question: "What happens to my muscles in space?",
      answer: "In space, your muscles experience significant changes: 1) Atrophy: Without gravity's resistance, muscles can lose up to 20% of their mass within 5-11 days, 2) Fiber-type shifting: Slow-twitch fibers convert to fast-twitch, reducing endurance, 3) Neuromuscular changes: Coordination and firing patterns alter, affecting precision movements, 4) Metabolic shifts: Muscles utilize energy differently, affecting fatigue rates. STELLA's countermeasure program combines isometric, isotonic, and isokinetic exercises with electrical muscle stimulation to maintain muscle integrity across all fiber types, with particular emphasis on postural and locomotor muscle groups.",
      category: "physical-training"
    },
  
    // TECHNICAL TRAINING CATEGORY
    {
      question: "How do spacecraft life support systems work?",
      answer: "Spacecraft life support systems maintain a viable environment through several integrated subsystems: 1) Atmosphere Management: Regulates oxygen/nitrogen balance, removes CO2 using either lithium hydroxide canisters or regenerative systems, and filters particulates, 2) Water Recovery: Collects humidity and processes wastewater (including urine) to create potable water through filtration and chemical treatment, 3) Temperature Control: Uses heat exchangers, radiators, and liquid cooling loops to maintain habitable temperatures, and 4) Fire Detection/Suppression: Employs specialized sensors and non-toxic extinguishing methods. STELLA's Technical Systems module will train you on both operational procedures and emergency interventions for each component.",
      category: "technical-training"
    },
    {
      question: "What computer systems do I need to master for spaceflight?",
      answer: "For spaceflight, you'll need to master several computer systems: 1) Vehicle Command & Control: Interfaces for critical spacecraft functions like navigation and power management, 2) Environmental Control & Life Support Systems (ECLSS): Monitoring and maintaining life-sustaining conditions, 3) Communication Networks: Both internal systems and space-to-ground links with proper protocols, 4) Science Payload Management: Experiment control and data handling, and 5) Emergency Response Systems. STELLA's Technical Training module provides both theoretical knowledge and practical simulation exercises for each system, with emphasis on troubleshooting procedures during communication delays with ground control.",
      category: "technical-training"
    },
    {
      question: "How do spacecraft navigation systems work?",
      answer: "Modern spacecraft navigation combines several technologies: 1) Inertial Measurement Units (IMUs) use accelerometers and gyroscopes to track orientation and acceleration, 2) Star trackers identify stellar patterns to determine precise orientation, 3) GPS receivers (for near-Earth operations) pinpoint location, 4) Radar and laser ranging systems measure distance to other objects or docking targets, and 5) Ground tracking provides validation data. STELLA's navigation module teaches you both the theoretical principles and practical operation of these systems, including manual backup procedures for critical operations like docking and deorbit burns.",
      category: "technical-training"
    },
    {
      question: "What are the main spacecraft propulsion systems?",
      answer: "Spacecraft employ several propulsion systems depending on mission requirements: 1) Chemical Propulsion: Including hypergolic (self-igniting) propellants for main engines and maneuvering thrusters, 2) Electric Propulsion: Ion or Hall-effect thrusters for efficient, low-thrust maneuvers, 3) Cold Gas Thrusters: Simple nitrogen or helium jets for precise attitude control, 4) Monopropellant Systems: Using catalysts to decompose single propellants like hydrazine, and 5) Solid Rockets: For launch abort systems and some orbital maneuvers. STELLA's propulsion module trains you on operational parameters, failure modes, and emergency procedures for each system, with particular emphasis on thruster block management for orbital operations.",
      category: "technical-training"
    },
    {
      question: "How do spacecraft electrical power systems work?",
      answer: "Spacecraft electrical power systems consist of four main components: 1) Generation: Primarily through solar arrays that convert sunlight to electricity, or Radioisotope Thermoelectric Generators (RTGs) for deep space missions, 2) Storage: Battery systems (typically lithium-ion) store energy for eclipse periods or peak demand, 3) Distribution: Power control units route electricity through multiple redundant paths to vital systems, and 4) Management: Automated load shedding and priority algorithms ensure critical systems remain powered during shortages. STELLA's technical training includes both nominal operations and failure response scenarios, with particular focus on power budget management during critical mission phases.",
      category: "technical-training"
    },
    {
      question: "What is involved in spacecraft docking procedures?",
      answer: "Spacecraft docking is a precise operation involving multiple systems and phases: 1) Far-field approach: Using radar and optical sensors for initial positioning at 1000-200 meters, 2) Near-field approach: Switching to laser rangefinders and cameras for final alignment at 200-5 meters, 3) Contact and capture: Precisely controlling velocity (typically below 0.1 m/s) and alignment (within 5 cm lateral offset and 5° angular error) for soft docking, 4) Hard dock: Retracting the mechanism and creating an airtight seal, and 5) Vestibule pressurization and hatch opening. STELLA's docking simulator provides over 200 practice scenarios with increasing difficulty, including system failures and off-nominal approaches.",
      category: "technical-training"
    },
    {
      question: "How do I communicate with mission control from space?",
      answer: "Space-to-ground communication involves several systems and protocols: 1) Primary communication uses S-band (2-4 GHz) for voice and commands, and Ku-band (12-18 GHz) for high-data-rate telemetry and video, 2) Transmissions are routed through relay satellites like TDRS for near-continuous coverage, 3) During communication blackouts (like reentry), automated systems log data for later transmission, 4) All critical communications follow strict protocols with message verification and acknowledgment, and 5) Communication windows must be scheduled due to shared network resources. STELLA's communication module trains you on proper phraseology, equipment operation, and contingency procedures during comm loss events.",
      category: "technical-training"
    },
    {
      question: "What's the difference between orbital and suborbital flight?",
      answer: "The key differences between orbital and suborbital flight are: 1) Energy: Orbital flight requires reaching approximately 7.8 km/s velocity (28,000 km/h) to stay in orbit, while suborbital flights only need about 3-4 km/s, 2) Duration: Orbital flights can last indefinitely (with proper propulsion for station-keeping), while suborbital flights last only minutes before returning to Earth, 3) Trajectory: Orbital flight involves continuously falling around Earth due to balanced centripetal force, while suborbital follows a parabolic path like a baseball, 4) Technical requirements: Orbital vehicles need thermal protection systems for reentry and more robust life support for extended missions. STELLA's training program prepares you for both profiles, with specialized modules for each flight regime.",
      category: "technical-training"
    },
    {
      question: "How do spacewalk airlocks work?",
      answer: "Spacewalk airlocks are specialized chambers operating in several phases: 1) Pre-EVA check: Verifying suit integrity and airlock functionality, 2) Depressurization: Gradually reducing pressure from 14.7 psi (Earth atmospheric) to vacuum over 15-30 minutes to prevent decompression sickness, 3) Outer hatch operation: Opening to space while maintaining spacecraft pressure integrity, 4) Post-EVA repressurization: Carefully introducing air to return to spacecraft pressure, and 5) Contamination control: Procedures to prevent potentially dangerous particles from entering the habitat. STELLA's EVA module includes both nominal operation training and emergency scenarios such as rapid depressurization events and hatch mechanism failures.",
      category: "technical-training"
    },
    {
      question: "What spacecraft systems am I responsible for monitoring?",
      answer: "As a trained astronaut, you'll monitor several critical systems: 1) Environmental Control and Life Support Systems (ECLSS): Oxygen generation, carbon dioxide removal, temperature, humidity, and pressure, 2) Electrical Power Systems: Solar array performance, battery charge states, and power distribution, 3) Thermal Control: Radiator functionality and internal temperature regulation, 4) Attitude Control: Spacecraft orientation and stabilization status, 5) Communication Systems: Signal strength and data transfer rates, and 6) Propulsion: Propellant levels, thruster functionality, and leak detection. STELLA's technical training module includes both automated monitoring protocols and manual verification procedures, with emphasis on identifying subtle pre-failure indicators that automated systems might miss.",
      category: "technical-training"
    },
  
    // EMERGENCY PROCEDURES CATEGORY
    {
      question: "What happens if there's a pressure leak in space?",
      answer: "For spacecraft pressure leaks, STELLA trains you to follow this emergency protocol: 1) Recognize the warning signs: caution/warning alarms, hissing sounds, or unexpected pressure drops (typically below 13.9 psi), 2) Don oxygen masks immediately if available, 3) Locate the leak using ultrasonic leak detectors or visual inspection (floating debris may move toward the leak), 4) Isolate the affected module by closing hatches, 5) Implement temporary repairs using emergency patch kits, adhesive sealants, or improvised solutions like duct tape for small leaks, and 6) Prepare for emergency evacuation if the leak cannot be contained. Our pressure drop simulator trains you to perform these steps under time pressure, as you may have as little as 30 minutes to respond before hypoxia affects performance.",
      category: "emergency-procedures"
    },
    {
      question: "How do I handle a fire emergency in space?",
      answer: "For space fire emergencies, follow STELLA's proven protocol: 1) Alert the crew and ground control immediately"
    },
      {
        question: "How do I handle a fire emergency in space?",
        answer: "For space fire emergencies, follow STELLA's proven protocol: 1) Alert the crew and ground control immediately, 2) Don breathing apparatus if smoke is present, 3) Deactivate electrical equipment in the affected area to remove potential ignition sources, 4) Activate fire suppression systems—typically carbon dioxide or water mist depending on fire type, 5) Isolate the affected module by closing hatches if necessary to prevent smoke spread, and 6) Monitor air quality during and after the event. STELLA's fire response simulator trains you in various scenarios, accounting for the unique characteristics of fire in microgravity: flames burn spherically with less visible light, making detection challenging without proper training.",
        category: "emergency-procedures"
      },
      {
        question: "What happens if life support systems fail?",
        answer: "If life support systems fail, STELLA trains you to execute this tiered response: 1) Immediate actions: Don emergency oxygen masks, verify the nature of the failure (CO2 removal, oxygen generation, or temperature control), 2) Activate backup systems: Switch to redundant hardware or secondary operating modes, 3) Implement contingency configurations: Use portable scrubbers, emergency oxygen generators, or manual temperature regulation procedures, 4) Enact conservation protocols: Minimize physical activity to reduce CO2 output and oxygen consumption if supplies are limited, and 5) Prepare for evacuation to a safe haven module or return vehicle if restoration attempts fail. STELLA's mission-specific training tailors these procedures to your particular spacecraft architecture and available resources.",
        category: "emergency-procedures"
      },
      {
        question: "How do I respond to a medical emergency in space?",
        answer: "For space medical emergencies, STELLA trains you to: 1) Assess the situation using the ABCDE approach (Airway, Breathing, Circulation, Disability, Exposure), 2) Stabilize the patient using the Crew Medical Officer Kit and Automated External Defibrillator if needed, 3) Establish communication with ground-based flight surgeons for guidance, 4) Utilize onboard Ultrasound and diagnostic tools to gather critical information, 5) Administer appropriate medications from the spacecraft pharmacy, and 6) Prepare for potential emergency return if the condition is life-threatening. Remember that fluid administration, CPR, and patient positioning all require modification in microgravity, which STELLA's Medical Emergency module covers through specialized simulation training.",
        category: "emergency-procedures"
      },
      {
        question: "What if our spacecraft gets hit by space debris?",
        answer: "If your spacecraft is hit by space debris, STELLA's emergency protocol guides you to: 1) Verify the impact location and severity through pressure sensors and visual inspection, 2) Don oxygen masks immediately if depressurization is detected, 3) Isolate the damaged module by closing interconnecting hatches, 4) Assess structural integrity using onboard cameras and sensors, 5) Implement emergency repairs for small punctures using the specialized patch kits located in each module, and 6) Prepare for possible evacuation if damage exceeds repair capabilities. STELLA's unique debris impact simulation trains you to distinguish between momentary sensor glitches and actual impacts, a critical skill for avoiding false alarms while ensuring real emergencies receive immediate attention.",
        category: "emergency-procedures"
      },
      {
        question: "What is the emergency deorbit procedure?",
        answer: "STELLA's emergency deorbit procedure training covers these critical steps: 1) Secure all loose equipment and don pressure suits if time permits, 2) Verify spacecraft orientation using backup navigation systems if primary systems are compromised, 3) Calculate minimum-energy deorbit burn parameters using the emergency return calculator, 4) Execute de-orbit burn with available propulsion (primary or backup thrusters), 5) Verify burn effectiveness by monitoring trajectory change, and 6) Configure spacecraft for atmospheric entry (deploy heat shield, adjust control surfaces). Your training includes scenarios with degraded systems, communication blackouts, and off-nominal entry conditions to ensure you can safely return even when multiple systems are compromised.",
        category: "emergency-procedures"
      },
      {
        question: "How do I handle a toxic spill or ammonia leak?",
        answer: "For toxic spills or ammonia leaks, STELLA trains you to: 1) Don emergency breathing apparatus immediately and alert all crew members, 2) Isolate the contaminated area by closing hatches and deactivating ventilation to that section, 3) Identify the substance using onboard detection equipment (recognizing that ammonia has a distinctive odor but can quickly overwhelm smell receptors), 4) Contain the spill using specialized absorption materials from the emergency response kit, 5) Purge the affected area by venting to space if necessary and safe to do so, and 6) Decontaminate exposed surfaces and monitor air quality before removal of protective equipment. This protocol is particularly important for ammonia leaks from external cooling loops, which can be fatal if they enter the habitable volume.",
        category: "emergency-procedures"
      },
      {
        question: "What if communication with Earth is lost?",
        answer: "If communication with Earth is lost, STELLA's protocol guides you to: 1) Attempt comm restoration using backup systems and frequencies (S-band, UHF, VHF, and emergency channels), 2) Check antenna alignment and power systems to identify potential causes, 3) Implement the loss-of-communication procedures in your mission timeline, which typically involve continuing critical mission operations while deferring non-essential activities, 4) Attempt communication at pre-designated times when satellite coverage should be optimal, 5) Utilize text or low-bandwidth communication modes if voice channels remain unavailable, and 6) Prepare for autonomous decision-making if communication cannot be restored within mission-specific timeframes. STELLA's training emphasizes maintaining psychological composure during extended communication blackouts.",
        category: "emergency-procedures"
      },
      {
        question: "How do I respond to a computer system failure?",
        answer: "For computer system failures, STELLA trains you to follow these steps: 1) Identify whether the failure affects Command & Control, Life Support, Navigation, or Communications systems to prioritize your response, 2) Switch to redundant or backup systems using the appropriate procedures for your spacecraft, 3) Attempt system reboots following the sequence in your emergency checklist—typically starting with soft reboots before progressing to power cycling, 4) Utilize manual override capabilities where available for critical functions, 5) Implement degraded mode operations that maintain essential functions with minimal computing resources, and 6) Reconfigure remaining functional systems to compensate for the failed components. STELLA's technical training simulates cascading failure scenarios to prepare you for complex emergencies requiring real-time problem-solving.",
        category: "emergency-procedures"
      },
      {
        question: "What if the spacecraft propulsion system fails?",
        answer: "If the propulsion system fails, STELLA's emergency protocol guides you to: 1) Identify the specific nature of the failure—thruster malfunction, propellant leak, control system error, or valve failure, 2) Isolate failed components through the Propulsion Isolation Procedures to prevent cascade failures, 3) Activate redundant thruster blocks if available on your spacecraft, 4) Reconfigure the Guidance, Navigation and Control system to work with remaining operational thrusters, 5) Implement propellant conservation measures to maximize remaining capability, and 6) Evaluate mission impact and prepare for potential early return if orbital maintenance cannot be assured. STELLA's propulsion failure simulator trains you on both immediate response and long-term management of degraded propulsion capabilities.",
        category: "emergency-procedures"
      },
      {
        question: "How do I handle a power system failure?",
        answer: "For power system failures, STELLA trains you to execute this prioritized response: 1) Verify the scope of the failure—generation (solar arrays/fuel cells), storage (batteries), or distribution (power buses), 2) Implement immediate load shedding to conserve remaining power, prioritizing life support, communication, and thermal control, 3) Reconfigure power distribution to isolate failed components and utilize redundant paths, 4) Deploy backup power sources such as auxiliary batteries or emergency fuel cells if available, 5) Position spacecraft for optimal solar illumination if solar power generation is compromised but still functional, and 6) Establish minimum power consumption configuration for extended survival while troubleshooting. STELLA's Power Systems simulator includes scenarios ranging from partial degradation to complete blackouts requiring full system recovery.",
        category: "emergency-procedures"
      },
    
      // EVA (SPACEWALK) CATEGORY
      {
        question: "How do I prepare for a spacewalk?",
        answer: "STELLA's EVA preparation protocol includes these essential steps: 1) Pre-breathe pure oxygen for 4 hours to purge nitrogen from your bloodstream and prevent decompression sickness, 2) Complete the suit checkout procedures, verifying oxygen supply, cooling system, communication equipment, and display functionality, 3) Perform buddy checks of suit connections and tether attachments, 4) Review the detailed EVA timeline and procedures, mentally rehearsing each task and contingency plan, 5) Configure tools and equipment for easy access during the spacewalk, 6) Enter the airlock and conduct final pressure integrity checks before depressurization. STELLA's unique EVA simulation trains you to complete these preparations efficiently while maintaining focus on the upcoming tasks.",
        category: "eva-training"
      },
      {
        question: "How do spacewalk spacesuits work?",
        answer: "Modern EVA suits are complex personal spacecraft with multiple integrated systems: 1) Pressure Garment: Maintains internal pressure of 4.3 psi in a vacuum environment, 2) Life Support Backpack: Contains primary and secondary oxygen tanks, carbon dioxide removal system, and power supply for approximately 8-9 hours of EVA operations, 3) Liquid Cooling and Ventilation Garment: Circulates water through tubes to remove body heat, 4) Helmet Assembly: Incorporates lights, camera, display screens, and communication system, 5) Display and Control Module: Provides suit status information and allows parameter adjustments, and 6) Maximum Absorption Garment: Handles biological functions during extended EVAs. STELLA's suit training progresses from component familiarization to full-mission simulations in our underwater neutral buoyancy laboratory.",
        category: "eva-training"
      },
      {
        question: "How do I move during a spacewalk?",
        answer: "Effective EVA movement requires specialized techniques: 1) Always maintain at least one point of contact with the structure (the \"one hand for the ship\" principle), 2) Use handrails and foot restraints strategically to counteract every action with an equal and opposite reaction, 3) Move deliberately at about 1-2 feet per second to avoid building momentum that's difficult to stop, 4) Utilize body positioning to optimize mechanical advantage when applying force—your spacesuit limits mobility, especially in the gloves, 5) Conserve energy by planning efficient paths and using inertia to assist movement when possible, and 6) Manage your tethers and umbilicals continuously to prevent entanglement. STELLA's microgravity movement simulator progressively challenges you with increasingly complex navigation paths around spacecraft exterior mockups.",
        category: "eva-training"
      },
      {
        question: "What are the main risks during a spacewalk?",
        answer: "STELLA's EVA safety training addresses these primary risks: 1) Decompression incidents from suit puncture or seal failure, requiring immediate return to airlock, 2) Thermal extremes—temperatures varying from +250°F in sunlight to -250°F in shadow requiring active thermal management, 3) Radiation exposure, particularly during solar particle events which may necessitate EVA abortion, 4) Spatial disorientation and vertigo, which affect approximately 20% of first-time spacewalkers, 5) Glove abrasion and fingernail injuries, the most common EVA injury requiring specialized hand strengthening in your preparation, and 6) Tether failures or detachment, prevented through redundant safety systems and constant situational awareness. Each risk has specific mitigation procedures that you'll master through progressive training scenarios.",
        category: "eva-training"
      },
      {
        question: "How do I use spacewalk tools effectively?",
        answer: "Effective EVA tool usage requires these specialized techniques: 1) Utilize body positioning and foot restraints to create a stable work platform before applying force, 2) Understand tool reaction forces—in microgravity, every action creates an equal and opposite reaction that can push you away from the worksite, 3) Master the pistol grip tool (PGT)—an electronic power tool with programmable torque settings to prevent over-tightening fasteners, 4) Employ tethering protocols for all tools to prevent creating dangerous orbital debris, 5) Optimize tool caddy positioning within your limited field of vision, and 6) Practice one-handed operation since your other hand will often be used for stability. STELLA's tool training includes both virtual reality sessions and underwater neutral buoyancy exercises with flight-like tools.",
        category: "eva-training"
      },
      {
        question: "What is the buddy system for spacewalks?",
        answer: "The EVA buddy system is a comprehensive safety protocol: 1) Partners maintain visual or voice contact throughout the spacewalk, performing regular check-ins, 2) Each astronaut monitors their partner's suit telemetry on their Display and Control Module, watching for anomalies in oxygen, power, or cooling systems, 3) Astronauts verify each other's tether connections during translations between workstations, 4) Complex tasks are performed with one astronaut working while the buddy maintains situational awareness of the broader environment, 5) Emergency response procedures require immediate buddy assistance, especially for suit malfunctions or medical issues. STELLA's paired EVA simulations train you to maintain this protective oversight while efficiently completing mission objectives.",
        category: "eva-training"
      },
      {
        question: "How do I communicate during a spacewalk?",
        answer: "EVA communication follows these protocols: 1) Use short, precise phrases following standard NASA comm terminology—clarity trumps conversational speech, 2) Employ the phonetic alphabet (Alpha, Bravo, Charlie) when identifying specific components to prevent misunderstanding, 3) Acknowledge all instructions with confirmation of understanding and intent to comply, 4) Reserve the term \"emergency\" for genuine life-threatening situations requiring immediate response, 5) Use hand signals as backup if radio communication fails—thumbs up/down, finger pointing, and touch signals are standardized, 6) Maintain regular status reports even when not actively communicating about tasks. STELLA's EVA scenarios practice degraded communication situations to ensure you can complete critical operations even with partial or no verbal capability.",
        category: "eva-training"
      },
      {
        question: "What if something goes wrong during a spacewalk?",
        answer: "STELLA's EVA contingency training covers these critical scenarios: 1) Suit pressure drop: Activate emergency oxygen, inform mission control, and return to airlock immediately using the shortest path, 2) Cooling system failure: Switch to backup cooling if available, otherwise return to airlock within 30 minutes before overheating occurs, 3) Communication loss: Use established hand signals and follow the predetermined EVA timeline, 4) Contamination (ammonia or other toxins): Remain in sunlight to bake off contaminants, then follow specialized ingress procedures to prevent habitat contamination, 5) Disorientation: Stop movement, establish visual reference points, and wait for equilibrium to return before proceeding. Each contingency has specific symptoms, response timelines, and procedures that you'll master through increasingly challenging simulation scenarios.",
        category: "eva-training"
      },
      {
        question: "How long can I stay outside during a spacewalk?",
        answer: "Contemporary EVA duration is limited by several factors: 1) Primary oxygen supply typically supports 6-8 hours of activity plus 30-45 minutes of reserve, 2) Battery power for suit systems lasts 8-9 hours depending on consumption rate, 3) Carbon dioxide removal capability extends to approximately 8-10 hours before performance degradation, 4) Water cooling system capacity is sized for 8 hours of variable metabolic rates, 5) Human factors including fatigue, dehydration, and psychological stress become significant after 6-7 hours of continuous EVA work. STELLA's spacewalk endurance training gradually builds your capacity to remain effective throughout the full duration, with particular emphasis on maintaining fine motor skills and decision-making capability during the final hour when fatigue is highest.",
        category: "eva-training"
      },
      {
        question: "How do I train for spacewalks on Earth?",
        answer: "STELLA's comprehensive EVA preparation includes multiple simulation environments: 1) Neutral Buoyancy Laboratory: Underwater training in a weighted spacesuit provides the closest approximation to microgravity for large-scale tasks, 2) Virtual Reality: High-fidelity simulations allow unlimited repetition of procedures with accurate visual and some tactile feedback, 3) Active Response Gravity Offload System (ARGOS): Suspends you on a precision counterbalance system for realistic movement practice, 4) Partial Gravity Simulator: Uses specialized support structures to simulate reduced gravity environments for planetary EVA preparation, 5) Vacuum Chamber Testing: Familiarizes you with suit operation in actual vacuum conditions. Your training program integrates all these methods, beginning with foundational skills before progressing to end-to-end mission simulations that combine multiple elements into realistic scenarios.",
        category: "eva-training"
  },

  // PSYCHOLOGICAL PREPARATION CATEGORY
  {
    question: "How do I prepare mentally for spaceflight?",
    answer: "STELLA's psychological preparation program addresses the unique mental challenges of spaceflight through: 1) Stress Inoculation Training: Gradual exposure to mission stressors in simulated environments to build resilience, 2) Cognitive Behavioral Techniques: Tools to manage anxiety, maintain focus, and optimize performance under pressure, 3) Team Cohesion Development: Exercises to build trust and communication skills with diverse crew members, 4) Isolation and Confinement Training: Extended stays in analog environments to adapt to the psychological constraints of spacecraft, 5) Metacognitive Awareness: Developing the ability to recognize your own psychological state and implement appropriate self-care strategies. Unlike traditional NASA programs that emphasize screening for resilience, STELLA actively builds these capacities regardless of your starting point.",
    category: "psychological-training"
  },
  {
    question: "How do astronauts deal with isolation in space?",
    answer: "STELLA's isolation management protocol includes these evidence-based strategies: 1) Structured routine: Maintaining consistent sleep-wake cycles and daily activities provides psychological stability, 2) Meaningful communication: Regular video calls with family and psychological support personnel with techniques to maximize connection despite time delays, 3) Privacy management: Establishing personal space even in confined quarters through physical or temporal boundaries, 4) Purposeful leisure: Engaging in activities that provide genuine enjoyment rather than mere distraction, 5) Team rituals: Participating in communal activities like meals or recreation to reinforce social bonds, and 6) Nature connection: Using virtual reality simulations of Earth environments to counter sensory monotony. Your personal isolation resilience profile will help customize these approaches to your specific psychological needs.",
    category: "psychological-training"
  },
  {
    question: "How do I manage stress during critical mission phases?",
    answer: "STELLA's Peak Performance Protocol trains you to manage stress during critical operations through: 1) Tactical breathing: Using the 4-4-4-4 pattern (inhale-hold-exhale-hold) to regulate physiological stress responses, 2) Cognitive reframing: Converting threat perceptions into challenge assessments to optimize performance biochemistry, 3) Procedural visualization: Mentally rehearsing operations in extreme detail, incorporating potential anomalies, 4) Attention control: Techniques to maintain focus on relevant information while filtering distractions, 5) Stress inoculation: Graduated exposure to stressors during training to build resilience pathways, and 6) Post-event recovery practices to reset your stress response system. Your training includes biometric monitoring to create personalized stress management profiles for different operational contexts.",
    category: "psychological-training"
  },
  {
    question: "How do I deal with conflict in a confined spacecraft?",
    answer: "STELLA's conflict management training addresses the unique challenges of space environments: 1) Early intervention: Addressing tensions when they first appear rather than allowing them to escalate in confined quarters, 2) Perspective-taking exercises: Structured techniques to understand the situation from all viewpoints, particularly across cultural differences, 3) Communication protocols: Using specific formats like 'When you [action], I feel [emotion], because [reason]' to prevent defensive responses, 4) Mediation skills: Training each crew member as a potential conflict facilitator for disputes they're not directly involved in, 5) Emotion regulation: Techniques to manage your own responses during high-tension interactions, and 6) Privacy-conscious resolutions that respect the lack of physical separation options in spacecraft. STELLA's simulations include increasingly challenging conflict scenarios based on actual spaceflight experiences.",
    category: "psychological-training"
  },
  {
    question: "What is space adaptation syndrome psychologically?",
    answer: "Beyond its physical manifestations, Space Adaptation Syndrome has significant psychological components that STELLA's program addresses: 1) Cognitive impairment: Spatial disorientation and motion sickness can reduce decision-making capacity by 35-50% during the adaptation period, 2) Mood disruption: The vestibular disturbance directly affects brain regions regulating emotion, creating irritability and anxiety, 3) Performance anxiety: Concerns about underperforming during this critical period can exacerbate symptoms, 4) Sleep disruption: SAS often interferes with crucial initial rest periods, compounding adaptation difficulties, 5) Social withdrawal: Astronauts experiencing symptoms may isolate themselves, impacting team cohesion. STELLA's Psychological Adaptation Module provides cognitive and behavioral techniques to specifically manage these challenges during your first 72 hours in space.",
    category: "psychological-training"
  },
  {
    question: "How do I maintain peak cognitive performance in space?",
    answer: "STELLA's Cognitive Optimization Protocol includes these evidence-based strategies: 1) Sleep hygiene: Techniques to maintain quality sleep despite noise, unusual light cycles, and mission demands, 2) Strategic stimulant use: Precisely timed caffeine consumption based on your personal metabolic profile and mission requirements, 3) Cognitive tempo management: Matching task types to your circadian rhythm peaks for attention, memory, and problem-solving, 4) Microdosing recovery periods: Brief 3-5 minute mental resets between tasks to prevent cumulative cognitive fatigue, 5) Environmental customization: Using light, sound, and temperature adjustments to maintain optimal brain function, and 6) Nutritional strategies: Specific food combinations timed to support cognitive performance during critical operations. Your personal cognitive profile will be established during training to customize these approaches to your unique patterns.",
    category: "psychological-training"
  },
  {
    question: "How do I maintain focus during long-duration missions?",
    answer: "For extended missions, STELLA's focus maintenance program employs: 1) Attention cycling: Structured rotation between focused, diffuse, and restorative attention states to prevent mental fatigue, 2) Novelty integration: Scheduled introduction of new elements to counteract the attention-degrading effects of environmental monotony, 3) Progressive goal structures: Breaking the mission into nested time horizons (daily, weekly, monthly) with meaningful milestones to maintain motivation, 4) Metacognitive monitoring: Regular self-assessment of attention quality with corresponding intervention protocols, 5) Environmental variation: Techniques to create psychological contrast even within unchanging physical spaces, and 6) Social attention practices: Structured interactions designed to leverage social engagement as an attention reset mechanism. STELLA's longitudinal training progressively extends your high-performance focus duration through graduated exposure protocols.",
    category: "psychological-training"
  },
  {
    question: "How do I handle emergency situations psychologically?",
    answer: "STELLA's Psychological Emergency Response training develops these critical capabilities: 1) Acute stress management: Techniques to maintain cognitive function during the initial 30-90 seconds of an emergency when stress neurochemistry peaks, 2) Attention narrowing prevention: Exercises to maintain situational awareness when the brain attempts to hyper-focus during threats, 3) Automatic response integration: Building procedural memory through repetition so critical actions occur despite stress degradation, 4) Group coordination under pressure: Maintaining effective team function when normal communication patterns are disrupted, 5) Post-emergency recovery: Techniques to reset your stress response system after the situation is resolved, preventing cumulative effects, and 6) Psychological first aid: Supporting crew members who may experience acute stress responses. These skills are developed through graduated exposure to increasingly realistic emergency simulations.",
    category: "psychological-training"
  },
  {
    question: "How do I deal with the Overview Effect?",
    answer: "STELLA's preparation for the Overview Effect—the profound cognitive shift experienced when seeing Earth from space—involves: 1) Anticipatory framing: Understanding the psychological mechanisms behind this experience before exposure, 2) Integration practices: Journaling and structured reflection techniques to process the cognitive and emotional impact, 3) Communication preparation: Developing personal language to articulate the experience to others, 4) Balanced perspective: Maintaining operational focus while allowing appropriate time for integration of the experience, 5) Identity framework adjustment: Tools to incorporate this perspective shift into your self-concept without destabilization, and 6) Post-mission meaning-making: Approaches to translate this experience into purposeful action after return. Unlike traditional programs that merely acknowledge this phenomenon, STELLA actively prepares you to harness its positive transformative potential while managing potentially disruptive aspects.",
    category: "psychological-training"
  },
  {
    question: "How do astronauts handle fear in space?",
    answer: "STELLA's fear management protocol includes these specialized techniques: 1) Threat vs. danger differentiation: Cognitive tools to distinguish between actual risks and subjective threat responses, 2) Physiological regulation: Body-based approaches to counteract fear responses like elevated heart rate and muscle tension, 3) Exposure hierarchy development: Gradually confronting specific space-related fears in simulation environments, 4) Operational focus shifting: Redirecting attention from emotional responses to procedural requirements during critical situations, 5) Team transparency: Appropriate communication about fear states with crew members to enable mutual support, and 6) Post-episode processing: Techniques to prevent sensitization after experiencing fear-inducing events. Your personalized fear profile will be developed during training to identify specific triggers and optimal management strategies for your unique psychology.",
    category: "psychological-training"
  },

  // LEADERSHIP AND TEAMWORK CATEGORY
  {
    question: "How do space crews maintain effective teamwork?",
    answer: "STELLA's Space Team Cohesion Protocol develops these critical capabilities: 1) Shared Mental Models: Creating common understanding of mission objectives, roles, and contingency plans through structured pre-briefs and simulations, 2) Communication Efficiency: Utilizing standardized terminology and concise information exchange patterns optimized for high-workload environments, 3) Psychological Safety: Establishing team norms that encourage speaking up about concerns regardless of hierarchy, 4) Workload Distribution: Dynamically balancing tasks based on current capacity rather than rigid role assignments, 5) Cross-Training: Developing redundant capabilities so any team member can perform critical functions if needed, and 6) Conflict Resolution Procedures: Implementing structured processes for addressing tensions before they impact team performance. STELLA's team training uses progressive simulation scenarios to develop these capabilities under increasingly challenging conditions.",
    category: "leadership-teamwork"
  },
  {
    question: "How does leadership work in space missions?",
    answer: "Space mission leadership differs from conventional environments in several ways: 1) Context-Dependent Authority: Leadership roles shift based on mission phase and technical requirements rather than remaining fixed, 2) Balanced Decision Models: Effective leaders blend autonomous decision-making during time-critical scenarios with consensus-building during planning phases, 3) Psychological Support Function: Leaders actively monitor team cohesion and individual well-being as core responsibilities, 4) Communication Management: Mediating between mission control directives and team implementation, adapting approaches for communication delays, 5) Adaptive Leadership Style: Shifting between directive, consultative, and delegative approaches based on situation demands rather than personal preference. STELLA's leadership module develops these specialized capabilities through graduated simulation experiences and personalized coaching based on your leadership tendencies.",
    category: "leadership-teamwork"
  },
  {
    question: "How do multinational crews overcome cultural differences?",
    answer: "STELLA's Cross-Cultural Integration Protocol addresses multinational team challenges through: 1) Cultural Intelligence Development: Structured exposure to the specific values, communication patterns, and work norms of your crew's cultures, 2) Critical Incident Analysis: Examining real space mission scenarios where cultural differences created challenges or advantages, 3) Communication Pattern Mapping: Identifying how direct vs. indirect communication preferences manifest in operational contexts, 4) Decision Preference Awareness: Understanding how cultural backgrounds influence risk tolerance and decision-making approaches, 5) Personal Need Expression: Developing culturally-appropriate ways to articulate individual requirements within team contexts, and 6) Shared Identity Creation: Building mission-specific values and practices that transcend national backgrounds. Your training includes immersive experiences with multinational crews in analog environments to develop practical cross-cultural collaboration skills.",
    category: "leadership-teamwork"
  },
  {
    question: "How do astronauts balance autonomy and obedience?",
    answer: "STELLA's Operational Authority Protocol addresses the complex balance between mission control direction and crew autonomy: 1) Decision Classification Framework: Categorizing decisions based on time-criticality, information availability, and consequence severity to determine appropriate authority, 2) Communication Rhythm: Establishing structured processes for routine vs. anomaly-driven interactions with ground control, 3) Disagreement Resolution: Protocols for constructively challenging directives when the crew has critical contextual information unavailable to mission control, 4) Time-Delay Management: Decision authority adaptations for deep space missions where real-time consultation becomes impossible, 5) Documentation Requirements: Clear standards for logging autonomous decisions to maintain operational transparency. This balanced approach differs from earlier space program models of strict hierarchical control, reflecting the evolution of human spaceflight operations toward more distributed authority.",
    category: "leadership-teamwork"
  },
  {
    question: "How do space crews handle personality conflicts?",
    answer: "STELLA's Crew Compatibility Program applies these specialized approaches to personality dynamics: 1) Compatibility Assessment: Using space-validated personality tools to identify potential friction points before they manifest, 2) Complementary Strength Mapping: Framing personality differences as team assets rather than liabilities through structured exercises, 3) Trigger Awareness: Developing individual insight into specific interactions that provoke negative responses, with corresponding management strategies, 4) Decompression Protocols: Establishing regular processes for addressing accumulating tensions before they reach conflict thresholds, 5) Communication Style Adaptation: Training in flexible interaction approaches to bridge different personality preferences, and 6) Structured Alone Time: Creating psychological space within physical constraints through scheduled private activities. Your personalized compatibility profile will be developed through ongoing assessment during training simulations.",
    category: "leadership-teamwork"
  },
  {
    question: "How are decisions made during space emergencies?",
    answer: "STELLA's Emergency Decision Protocol trains crews in these specialized approaches: 1) Tiered Response Framework: Categorizing emergencies by time criticality to determine appropriate decision processes (immediate commander action vs. brief team consultation), 2) Decision Authority Triggers: Clear thresholds that shift decision-making from collaborative to hierarchical modes, 3) Abbreviated Consultation: Structured formats for rapid input gathering when seconds matter, using standardized communication patterns, 4) Role-Based Execution: Automatic task distribution based on pre-established emergency assignments rather than real-time delegation, 5) Experience-Based Intuition: Training scenarios designed to build pattern recognition for rapid situation assessment, and 6) Post-Event Review: Non-punitive analysis processes to refine both individual and team decision capabilities after each event. This balanced approach maximizes both speed and accuracy during time-critical situations.",
    category: "leadership-teamwork"
  },
  {
    question: "How do astronauts maintain relationships with family while in space?",
    answer: "STELLA's Family Connection Protocol includes these specialized approaches: 1) Asynchronous Communication Strategies: Techniques for maintaining meaningful connection despite scheduling constraints and communication delays, 2) Ritual Preservation: Identifying and adapting important family rituals for the space environment, 3) Digital Presence Methods: Using technology to participate in significant events remotely through pre-recorded messages or scheduled downlinks, 4) Privacy Management: Establishing appropriate boundaries between mission activities and family communication in the confined environment, 5) Expectation Setting: Preparing both astronauts and families for the psychological impacts of separation through pre-mission training, and 6) Reintegration Planning: Preparing for the adjustment period upon return. Unlike traditional programs focused solely on the astronaut, STELLA provides resources for both crew members and their families to navigate the unique challenges of space separation.",
    category: "leadership-teamwork"
  },
  {
        question: "How do crews manage time efficiently in space?",
        answer: "STELLA's Orbital Efficiency Protocol optimizes productivity through: 1) Reality-Based Scheduling: Using space-validated time estimates that account for the unique challenges of microgravity work rather than ground-based assumptions, 2) Cognitive State Matching: Aligning task types with individual circadian rhythm patterns to leverage natural attention peaks, 3) Context Switching Minimization: Clustering similar activities to reduce the 15-40% productivity loss associated with frequent task changes, 4) Parallel Processing: Identifying opportunities for safe and effective multitasking during routine operations, 5) Margin Integration: Building realistic buffer times into schedules to accommodate the unexpected complications that frequently arise in space operations, and 6) Team Synchronization: Coordinating crew schedules to optimize both collaborative work periods and individual focus time. These approaches typically increase mission productivity by 20-30% compared to standard scheduling approaches.",
        category: "leadership-teamwork"
    }
]; 
// Function to populate the database
async function populateDatabase() {
    try {
      console.log(`Starting to populate SLL with ${trainingData.length} Q&A pairs...`);
      
      // Optional: Clear existing training data if you want to start fresh
      // Uncomment the next line to delete existing data (be careful!)
      // await StellaConversation.deleteMany({ userId: 'system' });
      
      let successCount = 0;
      
      // Process each Q&A pair
      for (const item of trainingData) {
        try {
          // Create user question
          const question = new StellaConversation({
            content: item.question,
            fromUser: true,
            userId: 'system',
            timestamp: new Date(),
            metadata: {
              category: item.category,
              source: 'training_dataset',
              aiAnalysis: {
                topics: [item.category],
                confidenceScore: 0.95
              }
            }
          });
          
          await question.save();
          
          // Create STELLA response
          const response = new StellaConversation({
            content: item.answer,
            fromUser: false,
            userId: 'system',
            timestamp: new Date(Date.now() + 1000), // 1 second after question
            metadata: {
              category: item.category,
              source: 'training_dataset',
              aiAnalysis: {
                confidenceScore: 0.98,
                topics: [item.category]
              }
            }
          });
          
          await response.save();
          successCount += 1;
          
          if (successCount % 5 === 0) {
            console.log(`Imported ${successCount} Q&A pairs so far...`);
          }
        } catch (error) {
          console.error(`Error importing Q&A: "${item.question.substring(0, 30)}..."`, error.message);
        }
      }
      
      console.log(`Successfully added ${successCount} Q&A pairs to SLL!`);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
  
  // Run the import function
  populateDatabase();