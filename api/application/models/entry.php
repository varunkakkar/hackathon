<?php

class Entry extends BaseModel
{
	/**
     * White list of attributes that can be mass assigned
     *
     * @var array
     */
    public static $accessible = array('description', 'data', 'email', 'name');


    /**
     * Rules for model validation.
     *
     * @var array
     */
    public static $rules = array(
        'description' => 'required',
        'data'        => 'required',
        'email'       => 'required|email',
    );

    /**
     * Do stuff before saving
     */
    protected function before_save() {
        $this->data = json_encode($this->data);
    }

    /**
     * Relate to votes
     *
     * @var array
     */
    public function votes()
    {
        return $this->has_many('Vote');
    }

    /**
     * Relate to votes with likes
     *
     * @var array
     */
    public function likes()
    {
        return $this->has_many('Vote')
            ->where('like', '=', 1);
    }

    /**
     * Relate to votes with dislikes
     *
     * @var array
     */
    public function dislikes()
    {
        return $this->has_many('Vote')
            ->where('like', '=', 0);
    }
}
