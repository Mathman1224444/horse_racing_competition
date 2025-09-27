import { useEffect, useMemo, useState } from 'react';

export default function BetForm({
  horses = [],
  locked = false,
  onSubmit
}) {
  const [betType, setBetType] = useState('win');
  const [amount, setAmount] = useState(1);
  const [perPerPermutation, setPerPerPermutation] = useState(1);
  const [selections, setSelections] = useState([]);
  const [boxed, setBoxed] = useState(false);

  // Helper function for calculating permutations
  const permutations = (n, r) => {
    if (r > n) return 0;
    let result = 1;
    for (let i = 0; i < r; i++) {
      result *= (n - i);
    }
    return result;
  };

  // Calculate total cost based on bet type and selections
  const totalCost = useMemo(() => {
    if (!boxed) return Number(amount);
    const n = selections.length;
    if (betType === 'exacta' && n >= 2) return perPerPermutation * permutations(n, 2);
    if (betType === 'trifecta' && n >= 3) return perPerPermutation * permutations(n, 3);
    return 0;
  }, [boxed, selections, betType, perPerPermutation, amount]);

  // Generate help text based on bet type
  const selectionHelp = useMemo(() => {
    switch (betType) {
      case 'win':
        return 'Select one horse to win the race';
      case 'place':
        return 'Select one horse to finish 1st or 2nd';
      case 'show':
        return 'Select one horse to finish 1st, 2nd, or 3rd';
      case 'atb':
        return 'Select one horse for win, place, and show (across the board)';
      case 'exacta':
        return boxed
          ? 'Select 2+ horses to finish 1st and 2nd in any order'
          : 'Select horses for 1st and 2nd positions (in order)';
      case 'trifecta':
        return boxed
          ? 'Select 3+ horses to finish 1st, 2nd, and 3rd in any order'
          : 'Select horses for 1st, 2nd, and 3rd positions (in order)';
      default:
        return 'Select your horses';
    }
  }, [betType, boxed]);

  // Reset selections when bet type changes
  useEffect(() => {
    setSelections([]);
    setBoxed(false);
  }, [betType]);

  // Handle horse selection
  const handleHorseSelection = (horseNumber) => {
    const isSingleSelection = ['win', 'place', 'show', 'atb'].includes(betType);

    if (isSingleSelection) {
      setSelections([horseNumber]);
    } else {
      setSelections(prev =>
        prev.includes(horseNumber)
          ? prev.filter(x => x !== horseNumber)
          : [...prev, horseNumber]
      );
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (selections.length === 0) return;

    const betData = {
      bet_type: betType,
      amount: boxed ? perPerPermutation : amount,
      boxed,
      perPerPermutation: boxed ? perPerPermutation : null,
      selections
    };

    onSubmit?.(betData);
  };

  // Check if submit should be disabled
  const isSubmitDisabled = locked || selections.length === 0 || totalCost <= 0;

  return (
    <div className="bet-form">
      <div className="bet-form__header">
        <h3>Place a Bet</h3>
        {locked && (
          <div className="bet-form__status bet-form__status--closed">
            Betting Closed
          </div>
        )}
      </div>

      <div className="bet-form__section">
        <label className="bet-form__label">
          Bet Type
          <select
            className="bet-form__select"
            value={betType}
            onChange={(e) => setBetType(e.target.value)}
            disabled={locked}
          >
            <option value="win">Win</option>
            <option value="place">Place</option>
            <option value="show">Show</option>
            <option value="atb">Across the Board</option>
            <option value="exacta">Exacta</option>
            <option value="trifecta">Trifecta</option>
          </select>
        </label>

        {(betType === 'exacta' || betType === 'trifecta') && (
          <label className="bet-form__checkbox">
            <input
              type="checkbox"
              checked={boxed}
              onChange={(e) => setBoxed(e.target.checked)}
              disabled={locked}
            />
            <span>Boxed</span>
          </label>
        )}
      </div>

      <div className="bet-form__section">
        <div className="bet-form__help">
          {selectionHelp}
        </div>

        <div className="bet-form__horses">
          {horses.map(horse => (
            <button
              key={horse.program_number}
              type="button"
              className={`bet-form__horse ${
                selections.includes(horse.program_number)
                  ? 'bet-form__horse--selected'
                  : ''
              }`}
              disabled={locked}
              onClick={() => handleHorseSelection(horse.program_number)}
            >
              <span className="bet-form__horse-number">
                #{horse.program_number}
              </span>
              <span className="bet-form__horse-name">
                {horse.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bet-form__section">
        {!boxed ? (
          <label className="bet-form__label">
            Amount ($)
            <input
              className="bet-form__input"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              disabled={locked}
            />
          </label>
        ) : (
          <label className="bet-form__label">
            Stake per permutation ($)
            <input
              className="bet-form__input"
              type="number"
              min="1"
              step="1"
              value={perPerPermutation}
              onChange={(e) => setPerPerPermutation(Number(e.target.value))}
              disabled={locked}
            />
          </label>
        )}
      </div>

      <div className="bet-form__footer">
        <div className="bet-form__total">
          Total cost: ${totalCost || 0}
        </div>
        <button
          className="bet-form__submit"
          type="button"
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
        >
          Submit Bet
        </button>
      </div>
    </div>
  );
}