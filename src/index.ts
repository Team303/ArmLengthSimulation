import chalk from 'chalk'
import util from 'util'

import Permutations from 'array-permutation'

abstract class Massive {
    abstract getMass(): number
    abstract getLength(): number
    abstract getCenterOfMass(): number

    getTorqueAtBase(): number {
        return this.getCenterOfMass() * this.getMass()
    }

    [util.inspect.custom]() {
        return `${this.constructor.name} { length: ${chalk.blue(`${this.getLength()} in`)}, mass: ${chalk.green(
            `${this.getMass().toFixed(2)} lb`
        )}, center: ${chalk.red(`${this.getCenterOfMass().toFixed(2)} in`)}, torque: ${chalk.magenta(
            `${this.getTorqueAtBase().toFixed(2)} in*lb`
        )} }`
    }
}

class Segment extends Massive {
    materialMass: number = 0

    constructor(public length: number) {
        super()

        /* Material Constants */

        const SEGMENT_WIDTH = 6 // in
        const MATERIAL_THICKNESS = 0.23622 // in (6mm)
        const MATERIAL_DENSITY = 0.0975437 // lb/in^3

        const HOLE_AREA = 3.9 + 1.1 // in^2
        const ROUND_AREA = SEGMENT_WIDTH * SEGMENT_WIDTH - Math.PI * (SEGMENT_WIDTH / 2) ** 2 // in^2
        const TOTAL_NEGATIVE_AREA = HOLE_AREA + ROUND_AREA // in^2

        const BEARING_EDGE_DISTANCE = 3 // in
        const WEIGHT_REDUCTION_RATIO = 0.4 // ratio

        /* Compute Material Mass */

        const lengthWithEdges = length + 2 * BEARING_EDGE_DISTANCE // in
        const segmentArea = lengthWithEdges * SEGMENT_WIDTH - TOTAL_NEGATIVE_AREA // in^2
        const segmentVolume = segmentArea * MATERIAL_THICKNESS // in^3
        const segmentMass = segmentVolume * MATERIAL_DENSITY * WEIGHT_REDUCTION_RATIO // lb

        this.materialMass = segmentMass * 2
    }

    getMass(): number {
        const CAN_SPARK_MAX = 0.25 // lb
        const NEO_MOTOR_MASS = 0.938 // lb
        const GEARBOX_BASE_KIT_MASS = 0.576 // lb
        const GEARBOX_5_STAGE_MASS = 0.303 // lb

        const CHAIN_SPROCKET_MASS = 0.5 // lb

        return (
            this.materialMass +
            CAN_SPARK_MAX +
            NEO_MOTOR_MASS +
            GEARBOX_BASE_KIT_MASS +
            GEARBOX_5_STAGE_MASS * 3 +
            CHAIN_SPROCKET_MASS
        )
    }

    getLength(): number {
        return this.length
    }

    getCenterOfMass(): number {
        const MASS_OFFSET = 5

        return this.length - MASS_OFFSET
    }
}

class Grabber extends Massive {
    getMass(): number {
        return 7.5
    }
    getLength(): number {
        return 12
    }
    getCenterOfMass(): number {
        return 4
    }
}

class Arm extends Massive {
    components: Massive[] = []

    constructor(...segmentLengths: number[]) {
        super()

        segmentLengths.forEach(len => {
            this.components.push(new Segment(len))
        })

        this.components.push(new Grabber())
    }

    getMass(): number {
        return this.components.reduce((acc, component) => acc + component.getMass(), 0)
    }

    getLength(): number {
        return this.components.reduce((acc, component) => acc + component.getLength(), 0)
    }

    getCenterOfMass(): number {
        // Calculates Center of Mass using this formula: (m1*d1 + m2*d2 + mn*dn) / (m1 + m2 + mn)

        // Accumulate all the dn values
        let d = this.components.reduce<number[]>((acc, component, index) => {
            const lengthOfPreviousComponents =
                index === 0 ? 0 : acc.reduce((length, _, index) => length + this.components[index].getLength(), 0)

            acc.push(lengthOfPreviousComponents + component.getCenterOfMass())
            return acc
        }, [])

        // Accumulate weighted sums
        const numerator = this.components.reduce(
            (weightedMass, component, index) => weightedMass + component.getMass() * d[index],
            0
        )

        // Accumulate the sum of all masses
        const denominator = this.components.reduce((mass, component) => mass + component.getMass(), 0)

        return numerator / denominator
    }

    [util.inspect.custom]() {
        let str = ''

        str += this.constructor.name

        str += ' {\n'
        str += `  length: ${chalk.blue(`${this.getLength()} in`)},\n`
        str += `  mass: ${chalk.green(`${this.getMass().toFixed(2)} lb`)},\n`
        str += `  center: ${chalk.red(`${this.getCenterOfMass().toFixed(2)} in`)},\n`
        str += `  torque: ${chalk.magenta(`${this.getTorqueAtBase().toFixed(2)} in*lb`)},\n`
        str += `  components: [\n`

        str += this.components.map(c => '    ' + c[util.inspect.custom]()).join(',\n')

        str += '\n'
        str += '  ]\n'
        str += '}'

        return str
    }
}

const range = (start: number, end: number) => [...Array(end - start)].map((_, index) => index + start)
const irange = (start: number, end: number) => range(start, end + 1)

function findAllCombinations(input: number[], sum: number, maxLength: number) {
    // Sort the array and remove duplicates
    input = [...new Set(input)].sort()

    const acc: number[][] = []
    findNumbers(acc, input, sum, 0, [])

    return acc.filter(combo => combo.length === maxLength)
}

function findNumbers(acc: number[][], input: number[], sum: number, index: number, temp: number[]) {
    if (sum == 0) {
        acc.push([...temp])
        return
    }

    for (let i of range(index, input.length)) {
        // checking that sum does not become negative

        if (sum - input[i] >= 0) {
            // adding element which can contribute to
            // sum

            temp.push(input[i])

            findNumbers(acc, input, sum - input[i], i, temp)

            // removing element from list (backtracking)
            const idx = temp.indexOf(input[i])
            temp.splice(idx, idx !== -1 ? 1 : 0)
        }
    }
}

function percentDifference(v1: number, v2: number): number {
    return (Math.abs(v1 - v2) / ((v1 + v2) / 2)) * 100
}

const SEGMENTS = 3

const TOTAL_LENGTH = 72 // in
const MIN_LENGTH = 12 // in

const possibleArmLengths = findAllCombinations(
    irange(MIN_LENGTH, TOTAL_LENGTH - MIN_LENGTH * (SEGMENTS - 1)),
    TOTAL_LENGTH,
    SEGMENTS
)

const possibleArmLengthPermutations = possibleArmLengths.map(Permutations.permutation).flatMap(p => [...p])
const filteredArmLengthPermutations = possibleArmLengthPermutations.filter(
    armConfig => true
    // armConfig.length <= 2 ||
    // (
    //     armConfig[0] + armConfig[1] >= armConfig[armConfig.length - 1]
    //     // && armConfig[armConfig.length - 1] + armConfig[armConfig.length - 2] >= armConfig[0]
    // )
)
const arms = filteredArmLengthPermutations.map(armConfig => new Arm(...armConfig))

arms.sort((a, b) => a.getTorqueAtBase() - b.getTorqueAtBase())

const bestArm = arms[0]
const worstArm = arms[arms.length - 1]

console.log(bestArm)
console.log(worstArm)

console.log(
    `Percent Difference: ${percentDifference(bestArm.getTorqueAtBase(), worstArm.getTorqueAtBase()).toFixed(2)}%`
)

console.log(
    arms.find(
        arm =>
            arm.components[0].getLength() === arm.components[1].getLength() &&
            arm.components[1].getLength() === arm.components[2].getLength()
    )
)
