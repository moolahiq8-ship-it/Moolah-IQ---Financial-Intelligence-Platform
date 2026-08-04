---
title: "How to Automate Appointment Reminders in Make (Build 3 of 5)"
date: "2026-08-04"
excerpt: "An empty salon chair on a Friday is $80 gone, and it happens every week. Here is the system that captures the booking, reminds twice, recovers the no-show, and asks for the review. Businesses pay a monthly fee to keep it running."
category: "Earn"
tags: ["automation", "make", "appointment reminders", "no-code", "side hustle"]
iqLevel: "Foundational IQ"
iqScore: 95
author: "Moolah IQ"
tldr: "Point a Cal.com booking webhook at Make, log every booking to a Google Sheet with a status column, then run a second scenario once an hour that reads the sheet and texts anyone 24 hours out and 2 hours out. Add branches for no-show recovery and review requests. Budget the Make Core plan at about $10.59 a month, because the hourly clock does not fit the free tier. Typical rates are $400 to $600 setup plus $150 to $350 a month."
youtubeId: "vL9bpw5sjS8"
---

Appointment reminder automation is the third build in this series and the one with the
most visible money attached to it. When a plumber misses a call, the loss is invisible.
An empty chair is not. The owner is standing there looking at it, with staff paid and
rent running.

A salon chair sitting empty on a Friday afternoon is roughly $80 gone, and it happens
every single week. This guide walks the whole system, start to finish: capture the
booking, log it, confirm it, remind twice, recover the ones who still miss, and ask for
a review when the visit is done.

This is Build 3 of 5 in the Micro-Automation series. Build 1 caught missed phone calls.
Build 2 caught missed website leads. This one catches the money that was already booked
and then walked away.

## What no-shows actually cost

Across 105 published studies, the average appointment no-show rate is about 23 percent
(Dantas, Fleck, Cyrino Oliveira and Hamacher, *Health Policy*, 2018). By sector it
varies a lot. Hair salons sit around 15 percent, dental around 12 percent, and mental
health considerably higher.

The good news is that this responds to treatment better than almost any other problem
on this list. A systematic review of 29 studies found SMS reminders reduce no-shows by
29 to 39 percent on average.

The reason is simple and it is worth saying to every owner you pitch. Almost nobody who
misses an appointment decided to miss it. They forgot, on a Tuesday, in the middle of a
genuinely hard week. A reminder is not a nag when it arrives once, the day before, in a
voice that sounds like the business itself.

## Read this before you build

This build needs **two scenarios**, and the second one runs on a clock. That puts it
past the Make free plan on both counts.

Make's free plan gives you 1,000 credits a month, a maximum of **two active scenarios**,
and a 15-minute minimum scheduling interval. The important detail is that a credit is
one **module execution**, not one scenario run. A scenario that wakes on a schedule
burns credits every time it checks, whether or not it finds anything.

So an hourly clock running 24 times a day for 30 days is 720 wake-ups. At three modules
per wake-up that is roughly 2,160 credits a month, from one scenario, before a single
message goes out.

Budget the **Core plan at about $10.59 a month** before you quote this build. Against a
$150 to $350 retainer it is a rounding error. Quoting a free build and then asking for
money in week two is how you lose a client.

One more honest note. Cal.com's own free tier includes native workflow reminders. If a
client only wants reminders and nothing else, say so out loud. What you are actually
selling here is the sheet, the recovery branch and the review ask, which Cal.com does
not do.

## What the system does

Five moves, in order.

1. A client books, and the booking lands in Make within seconds.
2. The booking is written to a Google Sheet and a warm confirmation goes out.
3. A reminder fires 24 hours before, and a short see-you-soon fires 2 hours before.
4. If they still do not arrive, a kind message the next morning offers a rebooking link.
5. If they do arrive, a review request goes out two hours after the visit.

The whole thing runs on a spreadsheet and a clock.

## Step 1: Capture every booking

Create a **Cal.com** account for the client and set up one event type matching their
service, with the correct duration and buffer. Connect their real calendar so
availability is accurate.

Cal.com's free plan covers **one user**, with unlimited event types and unlimited
calendar connections. If the business runs several staff on separate calendars, they
need the paid tier, and you price that into your setup fee rather than absorbing it.

In Cal.com, open **Settings, Developer, Webhooks**. Add a new webhook, subscribe to the
**BOOKING_CREATED** event, and paste in the URL from a fresh Make scenario that starts
with a **Webhooks, Custom webhook** module.

Give the scenario a plain name, something like *ClientName, booking capture*, so you can
find it again in six months. Then make one test booking under your own name before you
touch anything else.

**You are done when** your own booking lands in Make within seconds, carrying three
things: the customer name, the phone number, and the appointment time. Watch the run
history until you actually see it arrive.

Everything that follows reads from that single arrival. Get the capture wrong and the
whole shield stays dark. Get it right and the rest of this build is assembly.

## Step 2: Build the sheet that runs the machine

Do this immediately after the capture works, and never before. A scenario with nowhere
to write is a scenario you cannot debug at midnight.

Create a Google Sheet with exactly four headers in row one, lowercase:

`name | phone | appointment_time | status`

Add a **Google Sheets, Add a Row** module and map the four fields, setting status to the
literal word `booked`. Set the module to insert at the **bottom** of the sheet. If rows
land at the top, your date math in step 3 reads the wrong row.

Store `appointment_time` in a real date-time format, not as free text. That single
choice is the most common thing that breaks step 3.

Then add the confirmation, a text message and an email, fired the instant the row is
written. Write the wording once, in the owner's own voice, with an AI assistant helping
you draft it. Because this sends texts, the rule from Build 1 applies: register A2P
10DLC before a single message goes out, and include a reply STOP line in every message.

**You are done when** a test booking produces a row and a text within one minute.

Now open the sheet and look at it for a moment. That sheet is the brain, and every
automation after this one reads it. It is also the thing the client can actually
understand. A dentist will never open a scenario editor to check on things. She will
absolutely open a sheet, see today's names, and trust what she is looking at. Build the
brain somewhere the client can watch it working.

## Step 3: The hourly clock

This is the part most people get wrong, and it is the pattern worth learning once.

Make cannot put a scenario to sleep for a whole day and wake it before an appointment.
So you stop asking it to. You build a **second scenario** instead.

Scenario two starts with **Google Sheets, Search Rows**, filtered to status equals
`booked`. Set the schedule to run once every hour, at minute zero, around the clock.

Add a **Router** with two paths:

1. Path A fires when `appointment_time` is between 23 and 25 hours from now. That gets
   the day-before reminder.
2. Path B fires when it is between 1 and 3 hours from now. That gets the short
   see-you-soon.

Add a column such as `reminded_24` and set it after sending, so a reminder never fires
twice on the same row.

Set the **scenario timezone to the client's timezone, not yours**. Otherwise every
reminder lands an hour wrong twice a year, and you will not notice until a customer
does.

**You are done when** you shift a test row's time and the reminder fires on the next
hour. Sit and watch one full cycle before you trust it with real customers.

You will reuse this exact pattern in Build 5 without opening a manual.

## Step 4: Recovery and reviews

Turn this on **only after the reminder clock has run clean for a full day**. Recovery
firing on bad data will embarrass your client in front of their own customers.

This step reads the status column and branches on what it finds. The front desk types
one word into the sheet when somebody does not arrive. That single word is the only work
any human ever does inside this system.

When `no-show` lands, the recovery message goes out the following morning, not the same
night. It says they were missed, that life happens, and offers a link to pick a new
time. Write that message the way you would text a friend who forgot, because anything
colder reads like a debt collection notice. No guilt, no fee talk, one tap to rebook.

When the front desk marks a visit `done` instead, a different branch wakes up. It waits
two hours, then asks for a Google review with a direct link. That branch is the whole of
Build 4, arriving a week early.

If the front desk forgets to mark rows for a week, the system goes quiet rather than
wrong. Build it that way deliberately.

**You are done when** you mark yourself a no-show and the recovery text arrives on
schedule, then mark a row done and watch the review request land two hours later.

## Test the whole circuit

Book yourself in. Take the confirmation. Shift the times and trigger both reminders.
Mark yourself missed and read the recovery message. Then mark yourself done and wait for
the review ask.

When the full loop fires without you touching anything, the shield is alive.

## What to charge

Typical setup rates run $400 to $600. Monthly maintenance runs $150 to $350. Quote the
Make Core subscription as a separate line item rather than absorbing it.

Your pitch line is the strongest one in the series, because the owner can check the math
in their head while you are still talking: *if this saves two no-shows a month, it more
than pays for itself.*

Ask any salon owner what a no-show costs and they will answer instantly, to the dollar,
because it hurts every week. You are not convincing anyone they have a problem.

## Who buys this

Salons, barbers, dentists, med spas, physios, tattoo studios, auto detailers. Anyone
whose income arrives in booked slots.

They also cluster, which matters more than it sounds. Land one salon and there are ten
more within a mile watching her chairs stay full.

## The honest part

This is the most involved build of the five. Two scenarios, a status column, a full
testing loop. Your first one might take a weekend instead of an afternoon.

Good. That difficulty protects you. A dentist is never going to build an hourly clock
scenario. The gap between too technical for them and very learnable for you is exactly
where the monthly fee lives.

## Your assignment this week

It takes about ten minutes and you build nothing.

Walk into one appointment business you already use and ask a single casual question. Do
you get many no-shows? Then say nothing at all and let them talk.

Do not pitch anything in that conversation. The moment you sell, the honest complaining
stops and you lose the material. The frustration in the next thirty seconds is your
entire sales pitch, in their own words. Write down the exact phrases they use, because
those phrases are what closes the deal.

## Frequently asked questions

**Does this fit on Make's free plan?**
No. The free plan allows two active scenarios and 1,000 credits a month, and credits
bill per module execution rather than per scenario run. An hourly clock alone burns
roughly 2,160 credits a month. Budget the Core plan at about $10.59 a month and quote it
to the client as a line item.

**Why not just have one scenario wait until the appointment?**
Make cannot hold a scenario asleep for a full day and wake it on time. The hourly clock
is the honest way to handle timed messages, and it is the same pattern you will reuse
for quote follow-ups in Build 5.

**Can Cal.com send the reminders on its own?**
Yes, its free tier includes native workflow reminders. Say that to the client honestly.
What this build adds is the sheet the owner can read, the no-show recovery branch, and
the review request, none of which Cal.com does.

**What is A2P 10DLC and do I need it?**
It is a registration that United States carriers require before a business can text
customers. You register a Brand, roughly $4 one time, and a Campaign, $15 one time plus
about $1.50 to $10 a month. Approval takes up to five business days. Every message must
carry a reply STOP line. Unregistered messages are blocked outright.

**What if the front desk forgets to mark rows?**
Nothing bad happens. The recovery and review branches read the status column, so if
nobody marks anything the system simply goes quiet. Reminders keep running, because they
read the appointment time rather than the status.

**How long does the build take?**
Under an hour once you know the modules. Your first one will likely take a weekend,
because you are learning the webhook, the router filters and the date math at the same
time.

---

*Build 4 of 5 is the Review Request Engine, which turns those completed visits into map
rankings.*

*The full written playbook for all five builds, plus the outreach message that lands the
first client, is free in the [5-Week Micro-Automation
Builder](/downloads/5-week-automation-builder.pdf).*
