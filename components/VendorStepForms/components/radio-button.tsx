import React from 'react'

interface RadioCompontent {
    data: { id: string, label: string }[],
    selectedOption: string | null,
    setSelectedOption: (id: string) => void
};

/**
 * Chips with a real radio indicator.
 *
 * The indicator used `roze-default`, a colour the Tailwind theme no longer defines, so the selected
 * chip painted nothing (a white dot on no background) while every UNSELECTED chip showed a solid
 * grey dot: on the registration form the chosen option looked empty and the others looked filled
 * ("all three Cancellation Policy dots look filled"). Now: unselected = an empty ring, selected = a
 * gold ring with a gold dot and a gold-tinted chip. The input stays focusable (it was `display:none`,
 * which took the whole group out of the keyboard's reach).
 */
const RadioButton:React.FC<RadioCompontent> = ({data, selectedOption, setSelectedOption}) => {
    // one native group per control (Covid and Cancellation used to share a name, so the arrow keys walked across both)
    const groupName = React.useId();
    // Safety check to prevent map error
    if (!data || data.length === 0) {
        return null;
    }

    return (
        <div role="radiogroup" className="flex flex-wrap items-center gap-3 mt-3">
            {data.map((option) => {
                const selected = selectedOption === option.id;
                return (
                    <label
                        key={option.id}
                        className={`flex items-center cursor-pointer space-x-1.5 py-1.5 pr-5 lg:pr-8 rounded-full border focus-within:ring-2 focus-within:ring-bridal-gold/40 ${selected ? "border-bridal-gold bg-bridal-gold/10 shadow-sm" : "hover:bg-gray-100"}`}>
                        <input
                            type="radio"
                            name={groupName}
                            value={option.id}
                            checked={selected}
                            onChange={() => setSelectedOption(option.id)}
                            className="sr-only"
                        />
                        <div className="size-8 flex items-center justify-center">
                            <span
                                aria-hidden
                                className={`size-5 rounded-full border-2 flex items-center justify-center ${selected ? "border-bridal-gold-dark" : "border-[#9aa5ad]"}`}>
                                {selected && <span className="size-2.5 rounded-full bg-bridal-gold-dark" />}
                            </span>
                        </div>
                        <span className={selected ? "text-bridal-gold-dark text-sm font-medium" : "text-[#6b7983] text-sm font-medium"}>{option.label}</span>
                    </label>
                );
            })}
        </div>
    )
}

export default RadioButton
