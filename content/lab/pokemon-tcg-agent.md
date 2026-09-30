---
title: "Pokémon TCG Agent: Information Set MCTS and Determinization"
date: "2026-08-01"
status: "Exploration"
tags: ["MCTS", "Reinforcement Learning", "Game AI"]
summary: "Exploring whether Perfect Information Monte Carlo with two-stage archetype determinization can pilot Pokémon TCG decks without heavy transformer inference."
highlight: "Deck-agnostic PIMC successfully generalized across archetypes, but early iterations collapsed due to naive hidden-state determinization and strategy fusion."
---

## The Core Question

This was an attempt at kaggle's pokemon tcg agent competition, though I forgot to submit the latest agent I figured it's still an interesting learning experience. I actually learned to play pokemon TCG properly through this project, though unfortunately I couldn't pour more time at this project as much as I'd like to, this is still a fun experience.

<!-- <div class="video-embed">
  <iframe src="https://drive.google.com/file/d/FILE_ID/preview" allow="autoplay" allowfullscreen></iframe>
</div> -->

Pokemon TCG, well like most card game generally depends on 4 things, your strategy/archetype, what cards you actually got in your hand, the board condition, and lastly the opponents archetype. The stark difference between traditional card game like poker compared to TCG games is that there are infinite possibility of deck match-ups, which introduced a new complexity on its own. When playing blindly there are no way to know what the opponent might do or what the best way to play with the hidden states. Human players usually gain these informations by playing or watching them.

Given the complexity, my first hypothesis was that I could bound the hidden-information problem structurally: guess the opponent's deck archetype, sample from a realistic distribution of decklists for that archetype, and use Monte Carlo Tree Search (MCTS) to evaluate moves. This would theoretically be faster and more robust than a heavyIight guesser network.

## Architecture

The system wraps the provided C++ battle engine in Python, exposing a menu-driven API for legal actions. I tried implementing an AlphaZero-style MCTS guided by a small Transformer network, with two major modifications for hidden information:

```mermaid
flowchart TD
    A[Opponent Unrevealed Actions] --> B{Stage A: Archetype Classifier}
    B -->|Matches Meta Cluster| C[Select Archetype Shell (e.g. Dragapult ex)]
    B -->|Low Confidence| D[Generic Fallback Pool]
    
    C --> E{Stage B: Flex-Slot Sampler}
    E -->|Iighted by usage %| F[Concrete Decklist Guess]
    D -->|Uniform Sample| F
    
    F --> G[Determinized Simulation World]
    G --> H[Information Set MCTS]
    H --> I[Aggregate Action Value]
```

1. **Two-Stage Determinization**: Instead of a uniform prior over thousands of cards, I narrow the possible space. Stage A identified the opponent's archetype (37 mined clusters from the leaderboard) using early reveals (e.g., active Pokémon, energy attachments). Stage B sampled the 15-20 flexible tech slots within that established archetype shell.
2. **Perfect Information Monte Carlo (PIMC)**: I built a separate recursive UCT (Upper Confidence Bound applied to Trees) tree per determinized world, rather than a canonical shared-tree Information Set MCTS (ISMCTS). This bypassed the challenge of canonical move identity in a game where action indices change based on the opponent's state, though it sacrificed learning across determinizations at interior nodes.

## What Worked

**Deck-Agnostic Search**: The PIMC (Perfect Information Monte Carlo) search engine operated with zero hardcoded card knowledge. It evaluated options purely by simulating forward and scoring generic roles (attack damage, energy count, lethality). This allow the agent to pilot a completely new deck immediately just by swapping the input decklist. Though the current performance is not that much better compared to rule based agents.

**Behavioral Cloning Warm Start**: Using 2.2M real competitor decision pairs mined from Kaggle replays, I behaviorally cloned the Transformer model. This provided an essential AlphaGo-style warm start, avoiding the agonizingly slow climb from random play.

**League Generalization**: Early self-play produced a narrow mirror-match specialist that failed against novel decks. I replaced this with a population-style self-play league, rotating opponents from a pool of different decks and using past model snapshots as adversaries. After 13 generations, a model trained on a Mega Abomasnow ex deck achieved a 4-0 win record against a hand-tuned baseline.

![League Training Metrics](/lab/pokemon-tcg-agent/training_metrics.png)

## Failure Modes & Takeaways

**The Reinforcement Learning Loophole Exploitation**: In early iterations, I filled unknown opponent hidden cards with a dummy placeholder (Snorlax and Basic Energy). This caused the MCTS to explore a fictional future where the opponent never drew threats. The search was systematically blind to counter-attacks, rendering the network's evaluation completely inaccurate regardless of training time.

**Harvesting Replays at Scale**: I attempted to pull the ~100k+ Kaggle replays locally via the API to mine deck archetypes. This failed spectacularly. Resolving signed GCS URLs via the Kaggle API took 25-50 seconds per file from outside their infrastructure. I had to abandon local harvesting and port the extraction scripts directly into a Kaggle Notebook attached to the dataset mount.

**Strategy Fusion & Self-Mill**: The generic heuristic rollout initially misplayed stall decks (like Crustle). Because the search didn't inherently understand deck management or fatigue win conditions, the agent repeatedly drew itself to death. I introduced a deck-management reward shaping—a soft value penalty applied to states at or below a low-deck threshold—which successfully stopped the agent from making unnecessary card draws.

## What I'd Do Differently

The first thing I did when starting this project was learning about TCG and what the meta decks are. I wouldn't call this a mistake but I did get short-sighted into mostly working with decks that I understand, instead of what's in the leaderboard. I did pick decks from the leaderboard latter on but I didn't do much with them because I hit catastropical failure when training a Mega Kanghaskan/Crustle deck, because I haven't optimized the opponents yet.
Another thing is that I should've read the communitiy post more and learn what algorithm or model that people use to take into consideration.