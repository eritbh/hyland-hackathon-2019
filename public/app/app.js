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
			<ul>
				<li
					v-for="gist in gists"
					:key="gist.id"
					class="gist-item"
				>
					{{name(gist)}}
				</li>
			</ul>
		</div>
	`,
	mounted () {
		console.log('mounted')
		fetch('/api/gists').then(res => res.json()).then(data => {
			this.gists = data;
		})
	},
});

// Create the main Vue instance
new Vue({
	el: '#app',
	template: `
		<div class="app">
		test
			<gists-list username="geo1088"/>
		</div>
	`,
});
