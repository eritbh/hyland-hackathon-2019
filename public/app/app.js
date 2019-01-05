/* global Vue */
'use strict';

Vue.component('gists-list', {
	props: {
		username: String,
	},
	data () {
		return {
			gists: [],
		};
	},
	methods: {
		name (gist) {
			// Return filename of the first file (TODO)
			return Object.keys(gist.files)[0];
		}
	},
	template: `
		<div class="gists-list">
			<div
				v-for="gist in gists"
				:key="gist.id"
				class="gist-item"
			>
				{{name(gist)}}
			</div>
		</div>
	`,
	mounted () {
		// TODO: this request is incomplete and nothing will load
		fetch('https://api.github.com/users/Geo1088/gists').then(res => res.json).then(data => {
			this.gists = data; // TODO
		})
	},
});

// Create the main Vue instance
new Vue({
	el: '#app',
	template: `
		<some-component text="Hello, World!"/>
	`,
});
