---
title: "The Quote Chaser: How to Recover the Quotes You Already Wrote Off (Build 5 of 5)"
date: "2026-08-18"
excerpt: "A contractor sends a five thousand dollar quote on Tuesday and hears nothing back. He gets busy on another job that week and never follows up once. The deal dies in silence, and nobody ever learns why."
category: "Earn"
tags: ["automation", "make", "follow-up", "quotes", "side hustle"]
iqLevel: "Foundational IQ"
iqScore: 95
author: "Moolah IQ"
tldr: "Put every quote in one sheet with six columns and a status word. Point a Make scenario at that sheet so a new open row wakes it within fifteen minutes. A second hourly scenario does the date math and sends at two, five and ten days. An AI step names the actual project so the message does not read like a form letter. Then add the brake: if the status flips to won or lost, or the client replies, everything stops. Build time is one afternoon."
youtubeId: "fm6boTX_5rY"
---

## Half of all leads never get a second call

Ask any contractor how many quotes are sitting open right now. Most of them guess, and the guess is always low.

The ones they cannot name are the ones that quietly expire without a decision.

This is the fifth and last build in the series, and it recovers the biggest dollars of the five. Not because it wins new work, but because it collects on work you already did. You wrote the quote. You measured the job. You priced it. Then it went quiet, and quiet got read as no.

The research on this is unusually clear. <cite index="147-1">Velocify's analysis of roughly 3.5 million leads found that half of all leads never receive a second call, and that 93% of leads that eventually converted were reached by the sixth call attempt.</cite> <cite index="147-1">XANT's 2021 study across about 30 million contact attempts found that 81% of sellers stop at five attempts or fewer, while seven or more attempts yields around 15% more connections.</cite>

Almost everybody quits one attempt before the one that would have worked.

*A note on sourcing: a widely circulated statistic on this topic is attributed to the "National Sales Executive Association." <cite index="149-1">That organisation does not appear to exist and the numbers cannot be traced to a real study.</cite> The Velocify and XANT figures above are the verified alternatives.*

## Step one: the tracker

Rule six columns across one sheet.

Who the client is. What the job is. What it costs. The date you sent it. And one column reading **still open**, **won**, or **lost**.

Setup takes about fifteen minutes, once. The hard part is not the sheet. It is the typing afterward.

Every quote that leaves your hands has to land in a row the same day. Miss that typing and the system goes blind to that job. This is exactly where most people quietly abandon the thing they just finished building.

Ten seconds of typing, then close the laptop. Flip the status word later, on the day the client decides. Nothing else in this build waits on your memory.

**Do this if you send more than three quotes in a typical month.** Below that, a notebook on the passenger seat is genuinely fine.

**You are finished when** one real quote is sitting in that sheet, filled in properly. One row, and the build has something specific to work with.

A cabinet maker I know kept his quotes on paper, pinned to a corkboard. Two slid down behind his desk and turned up eleven months later. Both were jobs he could have won with one polite message. He never found out, because nothing in his shop was watching that corkboard.

## Step two: the trigger

A sheet on its own is just a list, and lists do not chase anybody. Somebody still has to open it every morning and decide who deserves a message.

Remembering is the exact thing that already failed you.

Inside Make, add a **watch rows** trigger and point it at that sheet. Set it to fire when a new row arrives carrying the word open. Give it fifteen minutes between checks, which is far faster than any client expects.

The scenario wakes up holding the name, the project, the amount and the date. That is everything a follow-up needs, handed over without a question asked.

**Do this** once the sheet has at least one row in open status. **Skip it** if your quotes still live in your head and your text messages.

**You know it works when** a test quote wakes the scenario within fifteen minutes. One row in, one clean run out, nothing stopping anywhere.

If you built the Review Request Engine in Build 4, this is the same watch rows module pointed at a different sheet. Copy the old scenario, change one field, and the pattern carries straight over in under five minutes.

That is worth naming plainly, because it is where most people stall: they rebuild from scratch every time instead of reusing what already works. The pattern is the asset, and you now own four of them. Four patterns is a service, and a service is something a business pays for.

## Step three: the clock

A trigger that fires the moment a quote is sent is just noise.

Send a nudge one hour after the quote and you look desperate rather than diligent. Send nothing for a month and the client has hired somebody else.

Add a second scenario that wakes itself once an hour. It reads the sheet and does the date math on every open row.

- **Two days out** — a gentle check-in.
- **Five days out** — a warmer note offering to hold the price a little longer.
- **Ten days out** — a quiet close that leaves the door open without pressure.

Consider setting the send hour to something calm, like nine in the morning.

**Do this** only after the trigger has run clean for one full day. A broken clock sitting on a broken trigger is very hard to read.

**You know it works when** all three messages land in the right order. Compress the dates on one test row and watch them fire in sequence.

Three nudges over ten days is not aggressive. Against the numbers above, it is still short of where the returns are.

## Step four: the wording

A perfectly timed message that reads like a form letter gets deleted anyway.

Think about the last automated follow-up you deleted without reading. It probably greeted you as a customer instead of using your name.

Add an AI step inside Make, sitting between the hourly clock and the send. Feed it the client name, the project description and the quote amount. Instruct it to write a short, warm check-in with no pressure, and to name that specific project in the first line.

So the two-day message asks whether the deck quote came through okay. Not whether *your recent quote* came through okay.

Three rules that matter more than the model you use:

1. **Under four sentences**, greeting to sign-off. Long follow-ups read as desperate and get skipped before the second line.
2. **One clear question**, then stop typing and let the silence do the work.
3. **Read it aloud** before it goes near a client. Your ear catches the salesman tone long before your eyes will.

**You are finished when** you read the test message aloud and hear the deck named.

The client feels remembered instead of processed. That feeling is the actual product here, not the automation.

## Step five: the brake

Everything so far only knows how to send. It does not know how to stop, and that is genuinely dangerous.

Nobody should receive a polite reminder after they have already said yes.

Add a filter that checks the status column before every send. If the row reads won or lost, nothing goes out. Add a second check that watches for a reply landing in your inbox. The moment somebody answers, that row goes quiet permanently.

**Do this in the same session as the clock.** Not the next day.

**You know it works when** you flip a test row to won and confirm the silence. No message, no error, nothing waiting in the queue.

The stop matters as much as all three nudges. A follow-up sequence with no brake will eventually embarrass you in front of a client you had already won.

## How do I know it worked?

Add two running totals at the bottom of the sheet: quotes sent this month, and quotes won this month, side by side.

Write both numbers down on day one. Write them down again on day sixty. The gap between those two dates is the entire sales conversation, already finished.

That cabinet maker was closing four quotes in ten and never understood why. After a season of steady, polite follow-up he was closing closer to six. Nothing about his pricing changed and nothing about his craft changed. The only thing that changed was that somebody finally asked a second time.

On five thousand dollar jobs, that difference is one extra job a month.

## That is the series

Five working systems, and this one runs whether you remember it or not.

Work you already finished deserves an answer, and asking for one is not pushy. Most of what gets lost in a year is lost by going quiet.

*This is education, not financial advice.*
