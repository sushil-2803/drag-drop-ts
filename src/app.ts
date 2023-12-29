//Project Type
enum ProjectStatus {
  Active,
  Finished,
}
class Project {
  constructor(
    public id: string,
    public title: string,
    public description:string,
    public people: number,
    public status: ProjectStatus
  ) {}
}
// Project State management
type Listener =(items:Project[])=>void;
class ProjectState {
  private listeners: Listener[] = [];
  private projects: any[] = [];
  private static instance: ProjectState; // by making this property static make sure that there is only one instace of this
  // we are creating a singleton Class
  private constructor() {
    // here by making constructor private the class cannot pe initialized outside the class definition
  }
  // to create a instance of this class we create method which checks for the instance of the class if exsists returns that or create a new and returns that
  // making the method static there cannont be more than one instacne of this method
  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }
  addListener(listenerFn: Listener) {
    this.listeners.push(listenerFn);
  }
  addproject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(Math.random().toString(),title,description,numOfPeople,ProjectStatus.Active)
    this.projects.push(newProject);
    for (const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
    }
  }
}
const projectState = ProjectState.getInstance(); //static method are called using the class name
//Validation
interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

function validate(validatableInput: Validatable) {
  let isValid = true;
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minLength;
  }
  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length <= validatableInput.maxLength;
  }
  if (
    validatableInput.min != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }
  if (
    validatableInput.max != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }
  return isValid;
}
//autobind decorator
function autobind(
  target: any,
  methodName: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this); // this refers to the  event here but we use bind method to change ths behaviour
      return boundFn;
    },
  };
  return adjDescriptor;
}
// ProjectList Class
class ProjectList {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLElement;
  assignedPorjects: Project[];
  constructor(private type: "active" | "finished") {
    this.assignedPorjects = [];
    this.templateElement = document.getElementById(
      "project-list"
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById("app")! as HTMLDivElement;
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as HTMLElement;
    this.element.id = `${type}-projects`;
    projectState.addListener((projects: Project[]) => {
    const relevantProjects = projects.filter((project)=>{
        if(this.type==='active'){
            return project.status===ProjectStatus.Active
        }
        return project.status===ProjectStatus.Finished
    })
      this.assignedPorjects = relevantProjects;
      this.renderProjects();
    });

    this.attach();
    this.renderContent();
  }
  private renderProjects() {
    const listEl = document.getElementById(
      `${this.type}-project-list`
    )! as HTMLUListElement;
    listEl.innerHTML=''
    for (const prjItem of this.assignedPorjects) {
      const listItem = document.createElement("li");
      listItem.textContent = prjItem.title;
      listEl.appendChild(listItem);
    }
  }
  private renderContent() {
    const listId = `${this.type}-project-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " Projects";
  }
  private attach() {
    this.hostElement.insertAdjacentElement("beforeend", this.element);
  }
}

// ProjectInput Class
class ProjectInput {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLFormElement;
  titleInputEmlemnt: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;
  constructor() {
    this.templateElement = document.getElementById(
      "project-input"
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById("app")! as HTMLDivElement;
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.element = importedNode.firstElementChild as HTMLFormElement;
    this.element.id = "user-input";
    this.titleInputEmlemnt = this.element.querySelector(
      "#title"
    ) as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector(
      "#description"
    ) as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector(
      "#people"
    ) as HTMLInputElement;
    this.configure();
    this.attach();
  }
  private clearInputs() {
    this.titleInputEmlemnt.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  }
  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputEmlemnt.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;
    const titleValidatable: Validatable = {
      value: enteredTitle,
    };
    if (
      !validate({ value: enteredTitle, required: true, minLength: 5 }) ||
      !validate({ value: enteredDescription, required: true, minLength: 5 }) ||
      !validate({ value: +enteredPeople, required: true, min: 1 })
    ) {
      alert("Invalid Input");
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }
  @autobind // using decorator in js to autobind this keyword to class instead of event bind method can also be used
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, description, people] = userInput;
      projectState.addproject(title, description, people);
      console.log(title, description, people);
      this.clearInputs();
    }
  }
  private configure() {
    this.element.addEventListener("submit", this.submitHandler); //using bind we telling which this refer to class or the event
  }
  private attach() {
    this.hostElement.insertAdjacentElement("afterbegin", this.element);
  }
}
const projInput = new ProjectInput();
const active = new ProjectList("active");
const finished = new ProjectList("finished");
