# Prop Trail

## Table of Contents
* Why a VSCode extension?
* What I learned
* Moving forward
* Bug sheet

### What a VSCode Extension?
I started working at Squarespace as a Frontend Software engineer in mid-August, only two months after graduating from college. Before joining the team, I told my manager that I was really familiar with React and Redux. I came in very confident in my skill in manuevering throught React codebases. I quickly realized that what I was writing in college was absolute child's play.

The hardest thing about getting used to an large-scale, advanced, and well-organized codebase is following the data. More specifically, following where props or component properties are getting passed around. Since the text editor that I use is open source, I thought to myself HackWeek would be a great opportunity for me to learn about VSCode extensions and create a tool that would not only help me but other React developers.

### What I Learned

#### VSCode Extension
I knew I wanted to make an extension because I work in VSCode. The hard part was learning and getting fairly comfortable with the myriad of APIs offered by VSCode.

#### Realizing I Don't Need an Extensions
When I realized that VSCode extensions weren't the move, I started looking into extended the supported classes in VSCode. So I started to like into the source code of the text editor, which, I've got to say, was supppeer intimidating. I really had no clue what I was looking for, but I kept reading through code snippets until I learned that I didn't even need to expand the preexisting classes available in VSCode

#### ASTs and Babel
When I was looking through the VSCode extensions marketplace I came across this [plugin](https://marketplace.visualstudio.com/items?itemName=OfHumanBondage.react-proptypes-intellisense) which is really similar to what I want to accomplish. So I checked out its source code. I noticed that it was using something called `babylon` to parse through chunks of code.

What are ASTs? They're Abstrack Syntax Trees, which are tree representations of code that makes it possible to travese, manipulate, and generate new code.

So this plugin has lead to me where I am right now. 

### Moving Forward

### Bug Sheet
* **Fixed** Whenever an unrelated variable has the same name as a prop, the extension will jump to component definition
  * Check to see if hovered element is inside component (`loc` comparison?)