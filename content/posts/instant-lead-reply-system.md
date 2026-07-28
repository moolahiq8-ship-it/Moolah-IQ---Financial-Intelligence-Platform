---
title: "How to Build an Instant Lead Reply System in Make (Build 2 of 5)"
date: "2026-07-28"
excerpt: "A website form that answers itself in nine seconds, drops the lead on the owner's calendar, and logs every inquiry. About an hour to build, and businesses pay a monthly fee to keep it running."
category: "Earn"
tags: ["automation", "make", "lead generation", "no-code", "side hustle"]
iqLevel: "Foundational IQ"
iqScore: 95
author: "Moolah IQ"
tldr: "Connect a website form to Make with a webhook, then add three modules: a Google Calendar event so the owner cannot miss the lead, an AI step that writes a reply naming the buyer's actual project, and a Google Sheets row that logs every inquiry. About an hour to build. Typical rates are $400 to $750 setup plus $150 to $300 a month."
youtubeId: "pD5n0e3V6ew"
---

An instant lead reply system connects a website form to an automation tool so
that every new inquiry triggers three things within seconds: a reply sent from
the business's own email address, a calendar event the owner cannot miss, and a
logged row in a spreadsheet. It takes about an hour to build in Make using a
webhook, a Google Calendar module, an AI step, and Gmail. Builders typically
charge four hundred to seven hundred fifty dollars to set one up, plus one
hundred fifty to three hundred a month to maintain it.

This is Build 2 of 5 in the Micro-Automation series. Build 1 caught missed phone
calls. This one catches missed website leads, and it is the build most
automation careers start with, because every business with a contact form has
the same wound.

## Why speed decides who gets the job

A customer fills out a form at nine at night. She is in buying mode right then.
An hour later she is at dinner. A day later she has talked to two competitors.
Two days later the job is gone and the owner never knew he was in a race.

The research on response time is consistent across studies: replying within
five minutes dramatically outperforms replying within thirty, and the gap is
measured in multiples rather than percentages.

Almost nobody is fast by hand. The owner is on a roof, in a meeting, or asleep.
The form email lands in an inbox between a supplier invoice and a newsletter.
Speed is not a personality trait, and it does not scale to two in the morning.
It has to be a system.

## What the system does

The instant a form is submitted, three things happen in sequence.

1. The lead lands on the owner's calendar as a visible block.
2. A warm reply goes out naming the customer's actual project.
3. The inquiry logs to a sheet so nothing is ever lost.

From the customer's side, she hits submit and nine seconds later a friendly
reply is in her inbox. To her, this business feels awake and organized. That
feeling is what wins the job before anyone has spoken.

## Step 1: Build the trigger

Open Make and start a new scenario with a webhook module.

A webhook is a doorbell between two apps. Make hands you a unique web address,
and that address is the bell. Paste it into the client's form settings so every
submission presses it once. WordPress, Squarespace, and Wix all send form
results to a web address like that.

If the client runs Facebook lead ads instead of a website form, it is easier.
Make carries a built-in trigger for lead ads, which skips the form settings
entirely and takes about ten minutes.

**You are done when** a test submission lights up your scenario history, showing
the buyer's name, phone, email, and message.

Everything downstream needs one clean signal to start from. Without a trigger
you are building an engine with no ignition.

## Step 2: Put every lead on the calendar

Add a Google Calendar module and choose create an event.

Put the buyer's name and phone number directly into the event title. Write it
plainly, like *new lead, Sarah, kitchen remodel*, so it reads at a glance. Set
the event for the next business morning, where the owner already looks.

**You are done when** a test lead appears as a block on tomorrow's calendar.
Open it on a phone, because that is where the owner will actually see it.

This step matters more than it looks. An email is something an owner might read.
A calendar block is something he walks past on his way out the door. Leads stop
being messages and start being appointments.

One plumber ran his entire business inside his phone calendar and checked email
twice a day, always already behind. Once new leads landed beside his job blocks,
he called them from the truck. His callback time dropped from six hours to
about twenty minutes. Nothing about his work ethic changed. The only thing that
changed was where the information waited for him.

## Step 3: Write the reply that names their project

Add an AI step inside Make, using Claude or ChatGPT.

Give it one instruction, written a single time, that it follows on every lead.
Tell it to confirm the request, promise a call within one business day, and
mention the buyer's project by name, pulled straight from the form. Keep the
whole reply under four sentences so it reads warmly on a phone.

**You are done when** a stranger reads the reply and swears a person wrote it.
Test it with a note sent from a friend's phone.

A cold automated reply lands worse than plain silence. *We have received your
request* reads like a parking ticket, not a welcome. Warmth plus speed turns a
stranger comparing three companies into a booked customer.

One wedding photographer's automatic reply opened with a single specific line:
*Hi Sarah, congrats on the engagement*, and it named the venue she had typed.
Couples told her the note felt like she had already started working. Her booking
rate went from one in nine inquiries to one in four. She did not take better
photographs that season. She simply reached the curb before anybody else did.

## Step 4: Send it from their address and log it

Add a Gmail module and send the reply from the client's own business address.
The customer should never see your name or your tools anywhere inside it.

Then add a Google Sheets module and log the lead in one row: name, contact,
project, and the exact time it arrived. That sheet becomes the monthly report
you hand the owner without being asked.

If the client wants texting, add Twilio and send the same reply by message. One
thing here is not optional: any business texting United States customers needs
A2P 10DLC registration through their carrier, and every message must carry a
reply STOP line.

**You are done when** one fake inquiry fires the calendar block, the email, and
the row. Watch all three land before you tell the client anything is finished.

The sheet is what makes the monthly fee obvious. The owner sees eleven leads
caught last month, and four of them arrived after midnight.

## Step 5: Price it without apologizing

The whole build takes about an hour once you know the modules. That hour is
exactly where new builders talk themselves into charging too little.

Typical setup rates run four hundred to seven hundred fifty dollars. Monthly
maintenance usually runs one hundred fifty to three hundred. Quote both together
in one sentence.

**You are done when** you can say both numbers out loud without flinching.

The client is not buying your hour of clicking. They are buying every lead that
no longer dies inside an inbox overnight. A contractor's average job runs near
five thousand dollars. Save one lead a quarter and the arithmetic stops being a
debate.

Your pitch line is one sentence: *no lead slips through on a busy day again.*
Every owner who has found a week-old inquiry in their inbox will feel it.

## Who buys this

Contractors, home services, law firms, agencies, and real estate offices.

Anyone already running lead ads is the warmest prospect on the list. They are
spending real money per lead and then letting those leads go cold. Show an owner
that gap and the retainer mostly sells itself.

## The honest part

The build is the easy hour. The setup for one specific business is what takes
care. Their form is unusual, their calendar is shared, their voice is
particular. That first messy setup is the skill you are actually developing, and
it is the reason this pays. If it were plug and play, they would not need you.

## Your assignment this week

Find three local businesses running Facebook or Google ads, which you can
literally see in your own feed. Submit a polite test inquiry on each website.
Time how long the reply takes.

If you get days of silence, you just found your prospect, and you are holding
the proof.

## Frequently asked questions

**How long does an instant lead reply system take to build?**
About an hour once you know the modules. Your first one will take longer,
probably two to three hours, because you are learning the webhook setup and the
AI prompt at the same time.

**What should I charge for it?**
Typical market rates run four hundred to seven hundred fifty dollars for setup,
plus one hundred fifty to three hundred a month to maintain. Price the outcome,
not the hour. The client is paying for leads that no longer die overnight.

**Do I need to know how to code?**
No. Make is a visual no-code tool. You connect modules by dragging and filling
in fields. The AI step is one written instruction in plain English.

**What is A2P 10DLC and do I need it?**
It is a registration United States carriers require before a business can send
text messages to customers. If you add the Twilio texting option, the client
needs it, and every message must carry a reply STOP line. Email-only builds do
not need it.

**Which is better, Make or Zapier?**
Both work. Make's visual scenario builder makes multi-step flows easier to see,
which matters when you are handing a build to a client. Either tool is a common
example rather than a recommendation.

---

*Build 3 of 5 is the No-Show Shield, the system that stops empty salon chairs
and missed dental appointments.*

*The full written playbook for all five builds, plus the outreach message that
lands the first client, is free in the 5-Week Micro-Automation Builder.*

*The [Build 2 playbook](/downloads/5WeekBuilder_Build2_InstantLeadReply.pdf) puts this whole build on one page. The [5-Week Micro-Automation Builder](/downloads/5-week-automation-builder.pdf) covers all five.*
