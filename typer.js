var Word = Backbone.Model.extend({
	move: function() {
		this.set({y:this.get('y') + this.get('speed')/5 });
	}
});

var Words = Backbone.Collection.extend({
	model:Word
});

var WordView = Backbone.View.extend({
	initialize: function() {
		$(this.el).css({position:'absolute','white-space' : 'nowrap'});
		var string = this.model.get('string');
		var letter_width = 25;
		var word_width = string.length * letter_width;
		if(this.model.get('x') + word_width > $(window).width()) {
			this.model.set({x:$(window).width() - word_width});
		}
		for(var i = 0;i < string.length;i++) {
			$(this.el)
				.append($('<div>')
					.css({
						width:letter_width + 'px',
						padding:'5px 2px',
						'border-radius':'4px',
						'background-color':'#fff',
						border:'1px solid #ccc',
						'text-align':'center',
						'display':'inline-block'
					})
					.text(string.charAt(i).toUpperCase()));
		}
		
		this.listenTo(this.model, 'remove', this.remove);
		
		this.render();
	},
	
	render:function() {
		$(this.el).css({
			top:this.model.get('y') + 'px',
			left:this.model.get('x') + 'px'
		});
		var highlight = this.model.get('highlight');
		$(this.el).find('div').each(function(index,element) {
			if(index < highlight) {
				$(element).css({'font-weight':'bolder','background-color':'#aaa',color:'#fff'});
			} else {
				$(element).css({'font-weight':'normal','background-color':'#fff',color:'#000'});
			}
		});
	}
});

var TyperView = Backbone.View.extend({
	initialize: function() {
		var wrapper = $('<div>')
			.css({
				position:'fixed',
				top:'0',
				left:'0',
				width:'100%',
				height:'100%'
			});
		this.wrapper = wrapper;
		
		var self = this;
		var text_input = $('<input>')
			.prop('disabled',true)
			.addClass('form-control')
			.css({
				'border-radius':'4px',
				position:'absolute',
				bottom:'0',
				'min-width':'80%',
				width:'80%',
				'margin-bottom':'10px',
				'z-index':'1000'
			}).keyup(function() {
				var words = self.model.get('words');
				var mistype = true;
				var minus = 0;
				for(var i = 0;i < words.length;i++) {
					var word = words.at(i);
					var typed_string = $(this).val();
					var string = word.get('string');
					if(string.toLowerCase().indexOf(typed_string.toLowerCase()) == 0) {
						mistype = false;
						word.set({highlight:typed_string.length});
						if(typed_string.length == string.length) {
							$(this).val('');
						}
					} else {
						word.set({highlight:0});
					}
				}
				if (mistype == true){
                    $(this).val('');
                    var score = self.model.get('score');
                    minus = 3;
                    score = score - minus;
                    if (score < 0) score  = 0;
                    self.model.set('score', score);
                } 
			});
		var btn_wrapper = $('<div>')
            .css({
                'position' : 'absolute',
                'top' : '10px',
                'width' : '20px',
                'z-index':'1000',
                'left' : '20px'
            });
        var btn_start = $('<button>')
            .addClass('btn btn-success')
            .html('<span class="glyphicon glyphicon-play"></span>')
            .click(
                function(){
                    self.model.start();
                    btn_start.prop('disabled',true);
                    btn_pause.prop('disabled',false);
                    btn_stop.prop('disabled',false);
                    text_input.prop('disabled',false);
                    text_input.focus();
                }
            );
        var btn_pause = $('<button>')
        	.prop('disabled',true)
            .addClass('btn btn-info')
            .html('<span class="glyphicon glyphicon-pause"></span>')
            .click(
                function(){
                    self.model.pause();
                    btn_pause.prop('disabled',true);
                    btn_start.prop('disabled',false);
                    text_input.prop('disabled',true);
                }
            );
        var btn_stop = $('<button>')
            .prop('disabled',true)
            .addClass('btn btn-warning')
            .html('<span class="glyphicon glyphicon-stop"></span>')
            .click(
                function(){
                    self.model.stop();
                    btn_pause.prop('disabled',true);
                    btn_start.prop('disabled',false);
                    btn_stop.prop('disabled',true);
                    text_input.prop('disabled',true);
                }
            );
        var score_el = $('<span>',{text:self.model.get('score')})
            .css({
                'font-size':'40px',
                'position': 'absolute',
                bottom:'0',
				'left':'20px',
				'margin-bottom':'10px'
            });
        this.score_el = score_el;
		
		$(this.el)
			.append(wrapper
				.append($('<form>')
					.attr({
						role:'form'
					})
					.submit(function() {
						return false;
					})
					.append(text_input))
				.append(btn_wrapper
                    .append(btn_start)
                    .append(btn_pause)
                    .append(btn_stop))
				.append(score_el)
			);
		
		text_input.css({left:((wrapper.width() - text_input.width()) / 2) + 'px'});
		text_input.focus();
		
		this.listenTo(this.model, 'change', this.render);
	},
	
	render: function() {
		var model = this.model;
		var words = model.get('words');
		this.score_el.text(model.get('score'));
		for(var i = 0;i < words.length;i++) {
			var word = words.at(i);
			if(!word.get('view')) {
				var word_view_wrapper = $('<div>');
				this.wrapper.append(word_view_wrapper);
				word.set({
					view:new WordView({
						model: word,
						el: word_view_wrapper
					})
				});
			} else {
				word.get('view').render();
			}
		}
	}
});

var Typer = Backbone.Model.extend({
	defaults:{
		max_num_words:10,
		min_distance_between_words:50,
		words:new Words(),
		status:null,
		score:0,
		min_speed:1,
		max_speed:5
	},
	
	initialize: function() {
		new TyperView({
			model: this,
			el: $(document.body)
		});
	},

	start: function() {
		var animation_delay = 20;
		var self = this;
		this.set('status',setInterval(function() {
			self.iterate();
		},animation_delay));
	},
    pause: function() {
        clearInterval(this.get('status'));
    },
    stop: function() {
        var words = this.get('words');
        var word;
        while (word = words.first()){
            word.destroy();
        };
        clearInterval(this.get('status'));
    },  
	iterate: function() {
		var words = this.get('words');
		if(words.length < this.get('max_num_words')) {
			var top_most_word = undefined;
			for(var i = 0;i < words.length;i++) {
				var word = words.at(i);
				if(!top_most_word) {
					top_most_word = word;
				} else if(word.get('y') < top_most_word.get('y')) {
					top_most_word = word;
				}
			}
			
			if(!top_most_word || top_most_word.get('y') > this.get('min_distance_between_words')) {
				var random_company_name_index = this.random_number_from_interval(0,company_names.length - 1);
				var string = company_names[random_company_name_index];
				var filtered_string = '';
				for(var j = 0;j < string.length;j++) {
					if(/^[a-zA-Z()]+$/.test(string.charAt(j))) {
						filtered_string += string.charAt(j);
					}
				}
				
				var word = new Word({
					x:this.random_number_from_interval(0,$(window).width()),
					y:0,
					string:filtered_string,
					speed:this.random_number_from_interval(this.get('min_speed'),this.get('max_speed'))
				});
				words.add(word);
			}
		}
		
		var words_to_be_removed = [];
		for(var i = 0;i < words.length;i++) {
			var word = words.at(i);
			word.move();
			
			if(word.get('y') > $(window).height() || word.get('move_next_iteration')) {
				words_to_be_removed.push(word);
			}
			
			if(word.get('highlight') && word.get('string').length == word.get('highlight')) {
				word.set({move_next_iteration:true});
			}
		}
		
		for(var i = 0;i < words_to_be_removed.length;i++) {
			if (words_to_be_removed[i].get('move_next_iteration') == true){
                this.set('score',this.get('score') + words_to_be_removed[i].get('string').length)
            }
			words.remove(words_to_be_removed[i]);
		}
		
		this.trigger('change');
	},
	
	random_number_from_interval: function(min,max) {
	    return Math.floor(Math.random()*(max-min+1)+min);
	}
});