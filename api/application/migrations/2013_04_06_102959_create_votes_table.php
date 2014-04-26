<?php

class Create_Votes_Table {

	/**
	 * Make changes to the database.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('votes', function($table)
		{
		    $table->increments('id');
		    $table->integer('entry_id')->unsigned();
		    $table->string('ip');
		    $table->boolean('like');
		    $table->timestamps();
		    $table->foreign('entry_id')
		    	->references('id')
		    	->on('entries')
		    	->on_delete('cascade')
		    	->on_update('cascade');
		});
	}

	/**
	 * Revert the changes to the database.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::drop('votes');
	}

}
