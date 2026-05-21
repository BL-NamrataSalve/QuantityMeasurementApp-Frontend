/**
 * QuantumMeasure - Pure Frontend Conversion Business Logic
 * Performs client-side dimensional unit conversions, operations, and validations.
 */

class ConverterException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConverterException';
    }
}

class QuantityConverter {
    // Conversion Factors (All converted to a standard Base Unit per category)
    static get UNITS() {
        return {
            LENGTH: {
                CENTIMETER: 1.0,      // Base unit
                INCH: 2.54,
                FEET: 30.48,
                YARD: 91.44
            },
            WEIGHT: {
                GRAM: 1.0,            // Base unit
                KILOGRAM: 1000.0,
                TONNE: 1000000.0
            },
            VOLUME: {
                MILLILITRE: 1.0,      // Base unit
                LITRE: 1000.0,
                GALLON: 3785.41
            },
            TEMPERATURE: {
                CELSIUS: 1.0,         // Evaluated dynamically via formulas
                FAHRENHEIT: 1.0
            }
        };
    }

    // Helper to get category of a unit
    static getCategoryOfUnit(unit) {
        for (const [category, unitsList] of Object.entries(this.UNITS)) {
            if (unitsList.hasOwnProperty(unit)) {
                return category;
            }
        }
        throw new ConverterException(`Unknown unit specified: ${unit}`);
    }

    // Rounding utility matching the backend's Math.round(value * 100.0) / 100.0
    static roundValue(value) {
        return Math.round(value * 100.0) / 100.0;
    }

    // Raw conversion (unrounded) for internal calculation chains
    static convertRaw(value, fromUnit, toUnit) {
        // Validate inputs
        if (value < 0) {
            throw new ConverterException("Value cannot be negative");
        }

        const category = this.getCategoryOfUnit(fromUnit);
        const targetCategory = this.getCategoryOfUnit(toUnit);

        if (category !== targetCategory) {
            throw new ConverterException(`Cannot convert between different categories: ${category} and ${targetCategory}`);
        }

        // Temperature (non-linear conversion)
        if (category === 'TEMPERATURE') {
            if (fromUnit === toUnit) return value;
            if (fromUnit === 'CELSIUS' && toUnit === 'FAHRENHEIT') {
                return (value * 9/5) + 32;
            }
            if (fromUnit === 'FAHRENHEIT' && toUnit === 'CELSIUS') {
                return (value - 32) * 5/9;
            }
        }

        // Linear conversions using factor multipliers
        const factors = this.UNITS[category];
        const valueInBase = value * factors[fromUnit];
        return valueInBase / factors[toUnit];
    }

    // Direct convert function (rounded output)
    static convert(value, fromUnit, toUnit) {
        const raw = this.convertRaw(value, fromUnit, toUnit);
        return this.roundValue(raw);
    }

    // Addition operation
    static add(val1, unit1, val2, unit2, targetUnit) {
        const category = this.getCategoryOfUnit(unit1);
        if (category === 'TEMPERATURE') {
            throw new ConverterException('Temperature operations do not support arithmetic calculations.');
        }

        // Convert both to target unit and add (using raw values to avoid premature rounding issues)
        const convertedVal1 = this.convertRaw(val1, unit1, targetUnit);
        const convertedVal2 = this.convertRaw(val2, unit2, targetUnit);
        
        const sum = convertedVal1 + convertedVal2;
        if (sum < 0) {
            throw new ConverterException("Result value cannot be negative");
        }

        return {
            value: this.roundValue(sum),
            unit: targetUnit,
            category: category
        };
    }

    // Subtraction operation
    static subtract(val1, unit1, val2, unit2, targetUnit) {
        const category = this.getCategoryOfUnit(unit1);
        if (category === 'TEMPERATURE') {
            throw new ConverterException('Temperature operations do not support arithmetic calculations.');
        }

        const convertedVal1 = this.convertRaw(val1, unit1, targetUnit);
        const convertedVal2 = this.convertRaw(val2, unit2, targetUnit);

        const diff = convertedVal1 - convertedVal2;
        if (diff < 0) {
            throw new ConverterException("Value cannot be negative"); // Matches backend subtraction validation
        }

        return {
            value: this.roundValue(diff),
            unit: targetUnit,
            category: category
        };
    }

    // Division operation
    static divide(val1, unit1, divisor) {
        const category = this.getCategoryOfUnit(unit1);
        if (category === 'TEMPERATURE') {
            throw new ConverterException('Temperature operations do not support arithmetic calculations.');
        }
        if (divisor === 0) {
            throw new ConverterException('Division by zero is not allowed.');
        }
        if (val1 < 0) {
            throw new ConverterException("Value cannot be negative");
        }

        const result = val1 / divisor;
        if (result < 0) {
            throw new ConverterException("Result value cannot be negative");
        }

        return this.roundValue(result);
    }

    // Comparison check
    static compare(val1, unit1, val2, unit2) {
        const category = this.getCategoryOfUnit(unit1);
        const category2 = this.getCategoryOfUnit(unit2);

        if (category !== category2) {
            throw new ConverterException(`Cannot compare values of different categories: ${category} and ${category2}`);
        }

        if (val1 < 0 || val2 < 0) {
            throw new ConverterException("Value cannot be negative");
        }

        // Convert both to base units
        let val1Base, val2Base;
        if (category === 'TEMPERATURE') {
            // Normalize to Celsius
            val1Base = this.convertRaw(val1, unit1, 'CELSIUS');
            val2Base = this.convertRaw(val2, unit2, 'CELSIUS');
        } else {
            const factors = this.UNITS[category];
            val1Base = val1 * factors[unit1];
            val2Base = val2 * factors[unit2];
        }

        // Comparison within epsilon tolerance from Quantity.java (0.0001)
        const diff = Math.abs(val1Base - val2Base);
        return diff < 0.0001;
    }
}
