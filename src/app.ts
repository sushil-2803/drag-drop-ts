//Validation
interface Validatable {
    value: string | number,
    required?: boolean,
    minLength?: number,
    maxLength?: number,
    min?: number,
    max?: number
}

function validate(validatableInput: Validatable) {
    let isValid = true;
    if (validatableInput.required) {
        isValid = isValid && validatableInput.value.toString().trim().length !== 0
    }
    if (validatableInput.minLength != null
        && typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
    }
    if (validatableInput.maxLength != null
        && typeof validatableInput.value === 'string') {
        isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
    }
    if (validatableInput.min != null && typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value >= validatableInput.min
    }
    if (validatableInput.max != null && typeof validatableInput.value === 'number') {
        isValid = isValid && validatableInput.value <= validatableInput.max
    }
    return isValid
}
//autobind decorator
function autobind(
    target: any,
    methodName: string,
    descriptor: PropertyDescriptor
) {
    const originalMethod = descriptor.value
    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this)// this refers to the  event here but we use bind method to change ths behaviour
            return boundFn;
        },
    }
    return adjDescriptor
}

// ProjectInput Class
class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement
    element: HTMLFormElement
    titleInputEmlemnt: HTMLInputElement
    descriptionInputElement: HTMLInputElement
    peopleInputElement: HTMLInputElement
    constructor() {
        this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement
        this.hostElement = document.getElementById("app")! as HTMLDivElement
        const importedNode = document.importNode(this.templateElement.content, true)
        this.element = importedNode.firstElementChild as HTMLFormElement
        this.element.id = 'user-input'
        this, this.titleInputEmlemnt = this.element.querySelector("#title") as HTMLInputElement
        this, this.descriptionInputElement = this.element.querySelector("#description") as HTMLInputElement
        this, this.peopleInputElement = this.element.querySelector("#people") as HTMLInputElement
        this.configure()
        this.attach()
    }
    private clearInputs() {
        this.titleInputEmlemnt.value = ''
        this.descriptionInputElement.value = ''
        this.peopleInputElement.value = ''
    }
    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputEmlemnt.value
        const enteredDescription = this.descriptionInputElement.value
        const enteredPeople = this.peopleInputElement.value
        const titleValidatable:Validatable={
            value:enteredTitle
        }
        if (
            !validate({value:enteredTitle,required:true,minLength:5}) ||
            !validate({value:enteredDescription,required:true,minLength:5}) ||
            !validate({value:+enteredPeople,required:true,min:1})
        ) {
            alert("Invalid Input")
            return;
        } else {
            return [enteredTitle, enteredDescription, +enteredPeople]
        }
    }
    @autobind // using decorator in js to autobind this keyword to class instead of event bind method can also be used
    private submitHandler(event: Event) {
        event.preventDefault()
        const userInput = this.gatherUserInput()
        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput
            console.log(title, description, people)
            this.clearInputs()
        }
    }
    private configure() {
        this.element.addEventListener('submit', this.submitHandler) //using bind we telling which this refer to class or the event
    }
    private attach() {
        this.hostElement.insertAdjacentElement('afterbegin', this.element)
    }
}
const projInput = new ProjectInput