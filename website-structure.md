## Pages
Throughout the pages, the terms user and player are used interchangeably

# Login
Users need to enter their email and password in order to log into the website.
There should be links to the 'Register' page to register a new user, and the 'Forgot Password' page if a user forgets their password. Upon successful login, the user should be sent to the 'All Events' page.

# Register
A new user can enter their email, username, and password. The email and username fields should be unique across the site. The username can be at most 16 characters long. There should be a check that the user re-enters their password to make sure they have the right one. Upon successful registration, the user should be sent to the 'All Events' page.
There should be a link to go back to the Login page.

# Forgot Password
A user enters their email address, and when they do so, they should be redirected to the 'Login' page and receive some sort of notification on screen that tells the user that a password reset has been sent to the given email

# Password Reset
A user enters a new password. The user should then be sent to the 'Login' page.

# Not Found
Users should be sent to this page if they try to access a page that doesn't exist

# Error
Users should be sent to this page if they encounter an error

# All Events
Users should be able to see a list of all available events. Each listed event should display it's event_name, a section containing a leaderboard, a section containing the results of the most recently resolved race from within that event, and a section containing some details about the next race in that event.
Users should only see a given event if there is an Entrant record that is associated with the given user/player and the given event.
The event_name should contain a hyperlink that directs users to the 'Event' page for that particular event
The last race section should contain a hyperlink that directs users to the 'Race' page for the most recently resolved race in that event
The next race section should contain a hyperlink that directs users to the 'Race' page for the next race in that event
All authenticated users should see buttons for adding an event and deleting an event.

# Event
Users should be able to see an overview of the details of a given event. The page should be divided into sections.
The first section should include basic information about the event. This includes its name, location, date, number of races, and current race number.
The second section should be an optional dropdown section that is read-only for non-Commissioner users. It should contain most of the rule fields for the event. This should include event_wallet_per_player, race_wallet_per_player, first_prize, second_prize, third_prize, and most of the other Event fields that were not shown in the first section.
The third section should be a standings section. If a player has an Entrant record stored for a particular event, then that player should appear on this standings section. The standings section should be a table consisting of five columns: player username, winnings, race wallet, event wallet, and total. All columns except for username should be dollar currencies, and the table should be sorted in descending order based on the total column.
The fourth section should consist of an overview of the next race for that event. This should include the race number, the list of scratched horses (determined by all of the Scratch records for that given race), the post time of the race, and a link to the 'Race' page for that particular race.
The fifth section should consist of all of the Races for that event in a list. The list should consist of eight columns: the race number, the post time of the race, the first horse, the second horse, the third horse, the fourth horse, the player who won the most money from that race (called Big Winner), and how much they won from that race (called Big Win). Each race number should contain a hyperlink that directs the user to the 'Race' page for the given race
The sixth section should consist of all Bets made for that Event. This should be presented as a list with the following columns: timestamp of the bet, username of the betting player, bet type, bet unit, bet cost, resolution, bet horses, and bet winnings. The user should be able to sort the list by whichever column they prefer.

# Race
Users should see an overview of the given race. The page should be broken into sections.
The first section should contain some basic details about the race. This should include the name of the event that race is associated with, the race number, and the post time of the race.
The second section should contain the list of scratched horses for that race (determined by the all of the Scratch records associated with the race) and the finishing order of the horses (determined by data from the Race Results associated with the race)
The third section should contain a list of payouts. This will pull in the multipliers from the Race Results associated with the race.
The fourth section should contain a list containing player's wallets. A player/user should only appear on this list if they have an Entrant associated with their user and the event that is associated with the race. The list should have the following columns: username, race wallet, event wallet, winnings, and results. The list should be sorted by username.
The fifth section should contain a list of all bets made for that Race. This should be presented as a list with the following columns: timestamp of the bet, username of the betting player, bet type, bet unit, bet cost, resolution, bet horses, and bet winnings. The user should be able to sort the list by whichever column they prefer.
There should be a button near the top of the page that allows a user to go to the 'Make Bet' page and bring with them the ID of the race that they came from.

# Make Bet
Users should be able to make a bet associated with a race. The race details should be pulled in from the Race page that the user was at before. From the Race record, the page should display a section containing the event name associated with the race, the race number, and the post time. The page should also contain a section listing the player's race wallet, event wallet, and winnings.
The user should then be able to input bet type, bet unit, and bet horses.
There should a button at the bottom for the user to submit the bet. After submitting the bet, the user should be sent back to the associated Race page

# Account
Users should be able to change their username, reset their password, and change their slogan.

# Add Event
Allows any user to create a new event. The page should have a form with all the fields from the Event table including event_name, location, date, num_races, wallets (event_wallet_per_player, race_wallet_per_player), prize amounts (first_prize, second_prize, third_prize), betting rules (can_rebet_winnings, can_bet_future_race, min/max_bets_per_race), and minimum bet amounts for each bet type. After successful creation, the user should be redirected to the Event page for the newly created event.

# Add Race
Allows any user to add a new race to an existing event. The page should display a dropdown to select the event, then a form to input race_number, post_time, and num_horses. The race_number should auto-increment based on existing races in the selected event. When the race is created, a corresponding Race Results record should also be automatically created with only the race_resultsId and raceId populated (all other fields left blank/null). After successful creation, the user should be redirected to the Race page for the newly created race.

# Edit Race
Allows any user to edit an existing race's details. The page should display dropdowns to select the event and then the race to edit. The form should allow editing of post_time, num_horses, is_open_for_bets, and is_resolved fields. There should be a warning when marking a race as resolved that this will trigger payout calculations. After saving changes, the user should remain on the same page with a success message.

# Edit Race Results
Allows any user to enter or modify the results for a completed race. The page should have dropdowns to select the event and race. The form should include fields for the finishing order (first_horse, second_horse, third_horse, fourth_horse) and all payout multipliers (win/place/show multipliers for each placed horse, exacta_mult, trifecta_mult, superfecta_mult, and pick multipliers). After saving, all associated bets should be automatically resolved and winnings calculated.

# Edit Bet
Allows any user to modify or invalidate a player's bet. The page should have search functionality to find bets by player username, event, or race. The user should be able to change the bet's resolution status, mark it as invalid with a reason, or adjust the bet_winnings amount. This is primarily for correcting errors or handling disputes. Changes should be logged for audit purposes.

# Add Scratch
Allows any user to scratch a horse from a race. The page should have dropdowns to select the event and race, then input the horse_num to scratch. There should be a list showing already scratched horses for the selected race. After adding a scratch, any affected bets should be automatically marked as 'Scratched' in their resolution field. The user should see a confirmation of how many bets were affected.