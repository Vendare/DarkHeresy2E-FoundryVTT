Summary of what's been changed and added.

Fixed enrichment for item and actor sheet notes so they work.
Added storm, twin-linked, and force traits and calculations. Also added rabbit punch talent as a weapon trait for simple use.
Added slot for temporary characteristic damage and buffs in advance page.
Fixed aim breaking spray weapons.
Added requisition button to gear page.
Changed specialty skills so they can accept alternative characteristics.

Added actor sheets for vehicles, aircraft, and starships.
Starships have custom inventory.
New items: Ship components, ship weapons, strike craft, and ground troops.
Ship weapons work for standard RAW for macrocannons, lances, and nova cannons.


HTML Sheets added
	- Chat
		○ Ship roll
	- Dialog
		○ Acquire roll
		○ Ship combat roll
	- Items
		○ Ground troops
		○ Squadrons
		○ Starship equipment
		○ Starship weapons
	- Actors
		○ Aircraft
		○ Vehicle
		○ Starship

		○ Actor tabs
			§ Aircraft combat
			§ Aircraft progression
			§ Starship combat
			§ Starship components
			§ Starship notes
			§ Starship progression
			§ Vehicle combat
			§ Vehicle progression
	- Changes to actor tab: gear.
		○ A new div in the encumbrance bar for acquisitions.

Other HTML changes
	- Added acquisition test button to gear tab.
	- Added characteristic damage box to characteristic in progression.
	- Added acquisition parts to chat/roll
	- Added starshipweapon, core, and suplementary to chat/item


Template
	- 3 new actor types | vehicle, aircraft, starship
	- 1 new actor template | vehiclestats
	- 5 new items | starshipCore, starshipSupplementary, starshipWeapon, squadrons, groundtroops.
	- 1 new item template | shipequipment.
	- Added to characteristic template: Characteristic Damage.

Common/Hooks
	- Added new sheets in for imports.
	- Added function to testInit and tests.
	- Hooks for actors and items.
	- Added new imports from dialog.js and roll.js

Common/Handlebars
	- Commented out the existing enrich HTML stuff since it didn't work, and I dont think it's needed.
	- Added new sheets templates for new actor types, new tabs, and new items.

Common/Item
	- Many new get functions added at the end. Perhaps more than was needed.

Common/actor
	- Added 3 new compute functions. Compute power, compute space, and compute squadrons.
	- Adjusted compute characteristics with an if statement for starship initiative from detection.
	- Adjusted compute experience because the previous formula seemed to cause errors with NPC sheets. Changed it from an else statement for talents and psychic powers to two if statements.
	- Added to compute movement the formulas for vehicle movement.
	- At end added new gets.

Common/roll
	- Added 6 new functions for ships.
		○ shipCombatRoll
			§ Just renames to send to right functions.
		○ computeShipRateOfFire
			§ Semi-auto is for lances.
			§ Full-auto is for macrobatteries.
		○ rollShipDamage
			§ Nova cannons require a special method.
		○ rollNova
			§ Nova cannons roll 1d5 to determine the number of hits, or 1d5+2 if degress of success is 2 or more. So a roller was needed.
		○ computeShipTarget
			§ Just a rename for computeShipRateOfFire.
		○ sendToChatShip.
			§ Just a rename to direct to the shiproll html.
	- Roll damage adjusted
		○ New if statement after the first hit is detected, for if the weapon is twin-linked, to add an additional hit if DoS is 2 or more.
		○ Then a new hit margin component for if the weapon has the storm trait, since it uses DOS differently.
	- computeDamage adjusted
		○ If a weapon has the inaccurate trait it triggers the accurate function. Simply added an if statement to look for an inaccurate trait first.
	- computeRateOfFire
		○ Added a few new if statements for storm function for standard shots, burst shots, and full auto
		○ Added a new bonus for twin-linked, they get +20 to hit modifier.
	- computeTarget
		○ Added acquire test function.

Common/dialog
	- prepareCombatRoll adjusted
		○ Added a new if statement for skip attack roll to give it the attacktype.name standard. This was so that when the weapon is fired it will use ammunition.
		○ Added an if statement for skip attack roll to the aim component, so that spray weapons would roll damage.
		○ If a weapon is inaccurate it cannot benefit from the aim action. Added an if statement that accomplishes this.
		○ An accurate weapon gets a +10 from using the aim action, added an if statement that achieves this.
	- Added prepareAcquireRoll function
		○ It just rolls influence with the modifiers for rarity, quality, and scale. It uses the dark heresy requisition table for its variables. However scale comes from Rogue trader.
	- Added prepareShipCombatRoll function

Common/utli
	- createWeaponRollData adjusted
		○ Added new if statements for if a weapon has the force quality to add psy rating to damage and penetration.
		○ Related to that is the rabbit punch talent. I felt it was easiest to implement this as a weapon trait, feel free to remove that part if you dont want to try communicating that strange function to people. It's an only war talent that lets unarmed attacks use Agility bonus for damage instead of strength.
	- extractWeaponTraits expanded
		○ Added storm, twin-linked, rabbit (see previous part), force, and inaccurate (for fixing inaccurate triggeting accurate) \.
	- createShipWeaponRollData function added.

Sheet/actor/actor.js
	- New listeners
		○ rollShipWeapon
		○ rollAcquire
	- Changed getdata to include enrichment
	- Added enrichment function for notes.
	- prepareRollSpecialty expanded
		○ Added new part.  This lets specialty rolls change their linked attribute. At least one talent can allow intelligence to be used for operate skills.
	- extractWeaponTraits expanded
		○ Added storm, twinlinked, rabbit, force, inaccurate traits.
	- constructItemLists
		○ Added new starship items to list.
	- Added preparRollShipWeapon and prepareRollAcquire functions.

Sheet/item.js
	- getData changed.
		○ Honestly I dont really know what the old code did, but everything works with the change I put in. Old code seemed to interfere with enrichment.
	- handleEnrichment function added
		○ This fixes notes for items and psychic powers.

Css/dark-heresy
	- Added many new CSS parts for the new HTML, as well as adjustments to existing HTML. left all changes at the end of the file.  My css starts at line 2058. Didn't use a less file as I was adjusting things from the client side module rather than the development module.

Lang/en
	- Added the new HTML language parts to the end of the file in alphabetical order. So they can more easily distinguished. I only speak english so cant translate to spanish, french, or polish.
	- Changed TITLE.ENCUMBRANCE value to be more fitting with added requisition button.
