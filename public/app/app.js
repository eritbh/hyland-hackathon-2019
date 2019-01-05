/* global Vue */
'use strict';

Vue.component('some-component', {
	props: {
		text: String
	},
	template: `
		<div class="some-component">
			{{text}}
		</div>
	`,
});

// Create the main Vue instance
new Vue({
	el: '#app',
	template: `
		<some-component text="Hello, World!"/>
	`,
});
