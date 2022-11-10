import { Injectable } from '@angular/core';
import { Activities } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class TtsPreloader {
  getTtsToCache(): {
    [key in Activities]: string[];
  } {
    return {
      sit_stand_achieve: [
        // Overlay Element
        "Please make sure you're in a safe environment.",
        "You'll need enough space to freely move.",
        'Take a break if you feel tired.',

        // Main
        'Starting Sit, Stand, Achieve',
        'You will need a chair for this activity.',
        'Please sit on the chair to continue.',
        'Great, lets begin.',
        'This activity is a simple play on the sit to stand exercise',
        'Please raise one of your hands to move further',
        'Please raise one of your hands to get started.',
        "Great job, looks like you're getting the hang of it",
        'Guide completed',

        // Remind user when they make a lot of mistakes.
        'An Odd number is any number ending with 1 3 5 7 9. Stand up when you see an Odd Number.',
        'An Even number is any number ending with 0 2 4 6 8. Sit down when you see an Even Number.',
        'When consecutive even or odd numbers appear Continue sitting or standing until the timer below runs out',
      ],

      beat_boxer: [
        // Overlay element
        'No chair required',
        'Space to move',
        'Please stand up',

        // Main
        "First, let's begin with a guide to beat boxer",
        'Welcome to beat boxer',
        'Punch when you see any object on the screen.',
        'Did you hear that? You just created sound by punching the punching bag.',
        'Remember to use your right hand to punch the red bags.',
        'Ready?',
        'Good job.',
        'Remember to use your left hand when you see a blue bag.',
        'Well done.',
        'And finally, avoid punching the caution signs.',
        "I knew you couldn't resist it.",
        "Let's try a few movements in a sequence. And try following a rhythm like this while playing the notes this time.",
        'You have the power to create the music by moving your body.',
        "Great job! looks like you're getting the hang of it.",
        'Guide complete.',
        'Starting Beat Boxer',

        // When they make a lot of mistakes.
        "Raise one of your hands when you're ready to begin.",
        'Remember to use your right hand when you see a red punching bag on the screen',
        'And when you see a blue punching bag on the screen, use your left hand.',
      ],

      sound_explorer: [
        "Raise one of your hands when you're ready to start.",
        'Use your hands to interact with the shapes you see on the screen.',
        'Did you hear that? You just created musical note by interacting with the shape.',
        "Let's try a few more.",
        'Good job. But single notes are just the beginning.',
        "Let's try interacting with more than 1 shape now.",
        'When you play multiple notes at the same time you create a harmony.',
        "Now let's try interacting with 3 shapes in one motion.",
        'When you interact with 3 or more shapes in one motion, you create a chord.',
        'Playing chords will give you extra points.',
        "Let's play a few more chords.",
        'If you touch the X shape, you will lose your chord streak. Try to avoid them.',
        "Looks like you're ready to put it all together now.",
        'Ready?',
        "Your time's up",
        'The guide is complete.',
        'Last activity. Sound Explorer.',
        'Please raise one of your hands to close the game.',
      ],

      moving_tones: [
        'Fingers stretched wide',
        'Posture upright and big',
        'Move feet to reach objects',
        'Last activity. Moving Tones.',
        'Make sure to have your fingers stretched while playing this game. Keep an upright posture and stay big. Move your feet if required to reach the objects on the screen.',
        'Raise one of your hands to start the tutorial.',
        "Raise one of your hands when you're ready to start.",
        'The objective of this game is to collect as many green coins as you can.',
        'Hold the right hand over the red circle when it first appears, to load the music coins.',
        "Now let's try the other hand.",
        'Hold the left hand over the blue circle when it first appears, to load the music coins.',
        "Let's try with both hands now.",
        'Follow your hand over the music coins to collect them and finish on the same colour on which you started.',
        'Well done!',
        "You're ready to start collecting some music coins.",
        'Tutorial Completed.',
        "Let's begin.",
        '3', // ribbon element
        '2',
        '1',
        "Let's Go!",
        'Raise both your hands if you want to add 30 more seconds to this activity.',
        'Activity completed.',
        'Well done. See you soon!',
      ],
    };
  }
}
